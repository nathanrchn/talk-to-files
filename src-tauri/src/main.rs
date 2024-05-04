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
use serde::{Serialize, Deserialize};
use std::fs::File;
use std::io::Write;
use std::sync::Arc;
use std::path::Path;
use std::fs;
use bincode::{Decode, Encode};

#[derive(Serialize)]
struct ResPayload {
  text: Vec<String>,
}

#[derive(Serialize, Deserialize, Debug, Clone, Encode, Decode)]
struct TextInfo {
    content: String,
    path: String,
}

#[tauri::command]
fn open_finder(path: String) {
  std::process::Command::new( "open" )
        .args(["-R", &path])
        .spawn()
        .unwrap();
}

#[tauri::command]
fn delete_db(app_handle: tauri::AppHandle) {
  let binding = app_handle.path_resolver().app_data_dir().unwrap();
  let app_data_dir = binding.to_str().unwrap();
  let text_map_path = Path::new(app_data_dir).join("text_map.bin");

  if text_map_path.exists() {
    let mut file = File::create(text_map_path).expect("Failed to create text_map.bin file");
    file.write_all(b"{}").expect("Failed to write initial data to text_map.bin file");
  }
}

#[tauri::command]
fn is_db_created(app_handle: tauri::AppHandle) {
  let binding = app_handle.path_resolver().app_data_dir().unwrap();
  let app_data_dir = binding.to_str().unwrap();
  let path = Path::new(app_data_dir);

  if !path.exists() {
    fs::create_dir_all(path).expect("Failed to create app_data_dir directory");
  }

  let text_map_path = path.join("text_map.bin");
  if !text_map_path.exists() {
    let mut file = File::create(text_map_path).expect("Failed to create text_map.bin file");
    file.write_all(b"{}").expect("Failed to write initial data to text_map.bin file");
  }
}

#[tauri::command]
async fn query_db(app_handle: tauri::AppHandle, text: String, num_results: u32) -> Result<Vec<String>, ()> {
    let binding = app_handle.path_resolver().app_data_dir().unwrap();
    let app_data_dir = binding.to_str().unwrap();
  
    let binding = Path::new(app_data_dir).join("embeddings.bin");
    let filename = binding.to_str().unwrap();
    let embedding_key = "my_embedding";
    let bert_model = BertInferenceModel::load(        
        filename,
        embedding_key,
    ).map_err(|_|())?;

    let text_map_path = Path::new(app_data_dir).join("text_map.bin");
    let mut text_map_file = File::open(text_map_path).unwrap();
    let text_map: Vec<TextInfo> = bincode::decode_from_std_read(
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
            let top_item_text = &model_ctx.1[r.0].content;
            let top_item_path = &model_ctx.1[r.0].path;
            format!(
                "{}|{:?}|{}|{}",
                r.0, r.1, top_item_path, top_item_text
            )
        })
        .collect();

    Ok(results)
}

#[tauri::command]
fn get_db(app_handle: tauri::AppHandle) -> Result<Vec<TextInfo>, ()> {
  let binding = app_handle.path_resolver().app_data_dir().unwrap();
  let app_data_dir = binding.to_str().unwrap();
  let text_map_path = Path::new(app_data_dir).join("text_map.bin");
  let mut text_map_file = File::open(text_map_path).unwrap();
  let text_map: Vec<TextInfo> = bincode::decode_from_std_read(
        &mut text_map_file,
        bincode::config::standard(),
  ).unwrap_or_default();

  Ok(text_map)
}

#[tauri::command]
async fn generate_embeddings(app_handle: tauri::AppHandle, text_infos: Vec<TextInfo>) {
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
  bincode::encode_into_std_write(&text_infos, &mut file, bincode::config::standard())
      .expect("failed to encode sentences");
  println!("text_map serialized to text_map.bin");

  let bert_model = BertInferenceModel::load(      
      "",
      "",
  )
  .unwrap();
  println!("bert model loaded");

  let sentences: Vec<String> = text_infos.into_iter().map(|info| info.content).collect();
  
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
    .invoke_handler(tauri::generate_handler![generate_embeddings, query_db, get_db, open_finder, is_db_created, delete_db])    
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}