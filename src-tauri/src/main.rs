// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

#[cfg(feature = "mkl")]
extern crate intel_mkl_src;

#[cfg(feature = "accelerate")]
extern crate accelerate_src;

mod model;
use model::BertInferenceModel;

use candle::Tensor;
use rayon::prelude::*;
use serde::{Serialize};
use std::fs::File;
use std::sync::Arc;
use std::path::Path;
use std::fs;

#[derive(Serialize)]
struct ResPayload {
  text: Vec<String>,
}

#[tauri::command]
async fn query_db(app_handle: tauri::AppHandle, text: String, num_results: u32) -> Result<Vec<String>, ()> {
    let binding = app_handle.path_resolver().app_data_dir().unwrap();
    let app_data_dir = binding.to_str().unwrap();
  
    let binding = Path::new(app_data_dir).join("embeddings.bin");
    let filename = binding.to_str().unwrap();
    let embedding_key = "my_embedding";
    let bert_model = BertInferenceModel::load(
        "",
        "",
        filename,
        embedding_key,
    ).map_err(|_|())?;

    let text_map_path = Path::new(app_data_dir).join("text_map.bin");
    let mut text_map_file = File::open(text_map_path).unwrap();
    let text_map: Vec<String> = bincode::decode_from_std_read(
        &mut text_map_file,
        bincode::config::standard(),
    ).map_err(|_|())?;

    let model_ctx = Arc::new((bert_model, text_map));

    let query_vector = model_ctx.0
        .infer_sentence_embedding(&text)
        .expect("error infering sentence embedding");
    let results: Vec<(usize, f32)> = model_ctx.0
        .score_vector_similarity(
            query_vector,
            num_results as usize,
        )
        .unwrap();

    let results: Vec<String> = results
        .into_iter()
        .map(|r| {
            let top_item_text = model_ctx.1.get(r.0).unwrap();
            format!(
                "{}|{:?}|{}",
                r.0, r.1, top_item_text
            )
        })
        .collect();

    Ok(results)
}

#[tauri::command]
fn get_db(app_handle: tauri::AppHandle) -> Result<Vec<String>, ()> {
  let binding = app_handle.path_resolver().app_data_dir().unwrap();
  let app_data_dir = binding.to_str().unwrap();
  let text_map_path = Path::new(app_data_dir).join("text_map.bin");
  let mut text_map_file = File::open(text_map_path).unwrap();
  let text_map: Vec<String> = bincode::decode_from_std_read(
        &mut text_map_file,
        bincode::config::standard(),
  ).map_err(|_|())?;

  Ok(text_map)
}

#[tauri::command]
async fn generate_embeddings(app_handle: tauri::AppHandle, sentences: Vec<String>) {
  let binding = app_handle.path_resolver().app_data_dir().unwrap();
  let app_data_dir = binding.to_str().unwrap();

  let text_map_path = Path::new(app_data_dir).join("text_map.bin");
  println!("{}", text_map_path.display());
  
  match fs::metadata(text_map_path.clone()) {
    Ok(_) => println!("The path exists"),
    Err(e) => match e.kind() {
        std::io::ErrorKind::NotFound => println!("The path does not exist"),
        _ => println!("An error occurred: {}", e),
    },
  }

  let mut file = std::fs::File::create(text_map_path).unwrap();
  bincode::encode_into_std_write(&sentences, &mut file, bincode::config::standard())
      .expect("failed to encode sentences");
  println!("text_map serialized to text_map.bin");

  let bert_model = BertInferenceModel::load(
      "",
      "",
      "",
      "",
  )
  .unwrap();
  println!("bert model loaded");
  
  // try to do this in parallel using rayon
  let results: Vec<Result<Tensor, _>> = sentences
      .par_chunks(350)
      .map(|chunk| bert_model.create_embeddings(chunk.to_vec()))
      .collect();

  println!("results generated");
  let embeddings = Tensor::cat(
      &results
          .iter()
          .map(|r| r.as_ref().unwrap())
          .collect::<Vec<_>>(),
      0,
  )
  .unwrap();

  let embeddings_path = Path::new(app_data_dir).join("embeddings.bin");

  embeddings
      .save_safetensors("my_embedding", embeddings_path)
      .unwrap();
  println!("embeddings.bin saved");
}

fn main() {
  tauri::Builder::default()
    .invoke_handler(tauri::generate_handler![generate_embeddings, query_db, get_db])    
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}