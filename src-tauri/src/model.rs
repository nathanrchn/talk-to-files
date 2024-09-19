#[cfg(feature = "mkl")]
extern crate intel_mkl_src;

#[cfg(feature = "accelerate")]
extern crate accelerate_src;

use candle::utils::metal_is_available;
use candle::{safetensors, Device, Tensor, Result};
use candle_nn::VarBuilder;
use candle_transformers::models::bert::{BertModel, Config, DTYPE};
use tokenizers::Tokenizer;

pub struct BertInferenceModel {
    model: BertModel,
    tokenizer: Tokenizer,
    device: Device,
    pub embeddings: Tensor,
}

fn device() -> Result<Device> {
    if metal_is_available() {
        Ok(Device::new_metal(0)?)
    } else {
        Ok(Device::Cpu)
    }
}

impl BertInferenceModel {
    pub fn load(
        embeddings_filename: &str,
        embeddings_key: &str,
    ) -> anyhow::Result<Self> {
        let device = device()?;
        // load the embeddings from a file
        let embeddings = match embeddings_filename.is_empty() {
            true => {
                println!("no file name provided. embeddings return an empty tensor");
                Tensor::new(&[0.0], &device)?
            }
            false => {
                let tensor_file = safetensors::load(embeddings_filename, &device)?;
                tensor_file
                    .get(embeddings_key)
                    .expect("error getting key:embedding")
                    .clone()
            }
        };
        println!("loaded embedding shape:{:?}", embeddings.shape());

        // load the model config
        println!("Loading model locally");

        let config_filename = "model/config.json";
        let tokenizer_filename = "model/tokenizer.json";
        let weights_filename = "model/model.safetensors";        

        let config = std::fs::read_to_string(config_filename)?;
        let config: Config = serde_json::from_str(&config)?;
        // load the tokenizer
        let tokenizer = Tokenizer::from_file(tokenizer_filename)
        .map_err(anyhow::Error::msg)?;
        // load the model
        let vb =
            unsafe { VarBuilder::from_mmaped_safetensors(&[weights_filename], DTYPE, &device)? };
        let model = BertModel::load(vb, &config)?;
        println!("Model loaded !");
        Ok(Self {
            model,
            tokenizer,
            device,
            embeddings,
        })
    }

    pub fn infer_sentence_embedding(&self, sentence: &str) -> anyhow::Result<Tensor> {
        let tokens = self
            .tokenizer
            .encode(sentence, true)
            .map_err(anyhow::Error::msg)?;
        let token_ids = Tensor::new(tokens.get_ids(), &self.device)?.unsqueeze(0)?;
        let token_type_ids = token_ids.zeros_like()?;
        let start = std::time::Instant::now();
        let embeddings = self.model.forward(&token_ids, &token_type_ids)?;
        println!("time taken for forward: {:?}", start.elapsed());
        println!("embeddings: {:?}", embeddings);
        let embeddings = Self::apply_max_pooling(&embeddings)?;
        println!("embeddings after pooling: {:?}", embeddings);
        let embeddings = Self::l2_normalize(&embeddings)?;
        Ok(embeddings)
    }

    pub fn create_embeddings(&self, sentences: Vec<String>) -> anyhow::Result<Tensor> {
        println!("create_embeddings: sentences.len():{}", sentences.len());
        let tokens = self
            .tokenizer
            .encode_batch(sentences, true)
            .map_err(anyhow::Error::msg)?;
        let token_ids = tokens
            .iter()
            .map(|tokens| {
                let tokens = tokens.get_ids().to_vec();          
                Ok(Tensor::new(tokens.as_slice(), &self.device)?)        
            })
            .collect::<anyhow::Result<Vec<_>>>()?;
        let token_ids = Tensor::stack(&token_ids, 0)?;
        let token_type_ids = token_ids.zeros_like()?;
        let embeddings = self.model.forward(&token_ids, &token_type_ids)?;
        println!("in");
        let embeddings = Self::apply_max_pooling(&embeddings)?; // apply pooling (avg or max)
        let embeddings = Self::l2_normalize(&embeddings)?;
        println!(
            "create_embeddings completed - shape:{:?}",
            embeddings.shape()
        );
        Ok(embeddings)
    }

    pub fn score_vector_similarity(
        &self,
        vector: Tensor,
        top_k: usize,
    ) -> anyhow::Result<Vec<(usize, f32)>> {
        let vec_len = self.embeddings.dim(0)?;
        let mut scores = vec![(0, 0.0); vec_len];
        for (embedding_index, score_tuple) in scores.iter_mut().enumerate() {
            let cur_vec = self.embeddings.get(embedding_index)?.unsqueeze(0)?;
            // because its normalized we can use cosine similarity
            let cosine_similarity = (&cur_vec * &vector)?.sum_all()?.to_scalar::<f32>()?;
            *score_tuple = (embedding_index, cosine_similarity);
        }
        // now we want to sort scores by cosine_similarity
        scores.sort_by(|a, b| b.1.partial_cmp(&a.1).unwrap());
        // just return the top k
        scores.truncate(top_k);
        Ok(scores)
    }

    pub fn apply_max_pooling(embeddings: &Tensor) -> anyhow::Result<Tensor> {
        Ok(embeddings.max(1)?)
    }

    // pub fn apply_mean_pooling(embeddings: &Tensor) -> anyhow::Result<Tensor> {
    //     let (_n_sentence, n_tokens, _hidden_size) = embeddings.dims3()?;
    //     let embeddings = (embeddings.sum(1)? / (n_tokens as f64))?;
    //     Ok(embeddings)
    // }

    pub fn l2_normalize(embeddings: &Tensor) -> anyhow::Result<Tensor> {
        Ok(embeddings.broadcast_div(&embeddings.sqr()?.sum_keepdim(1)?.sqrt()?)?)
    }
}
