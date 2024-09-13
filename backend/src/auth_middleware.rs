use actix_web::{dev::ServiceRequest, http::header, Error};
use actix_web::body::MessageBody;
use actix_web::dev::ServiceResponse;
use actix_web::middleware::Next;
use dotenv::dotenv;
use std::env;

pub  async fn authenticate(
    req: ServiceRequest,
    next: Next<impl MessageBody>,
) -> Result<ServiceResponse<impl MessageBody>, Error> {
    // pre-processing
    dotenv().ok();
    let api_key = std::env::var("API_KEY").expect("API_KEY must be set");
    let header_api_key = req.headers().get("api_key");
    if header_api_key != Some(&header::HeaderValue::from_str(&api_key).unwrap()) {
        return Err(actix_web::error::ErrorBadRequest("Invalid API key"));
    }

    // call the next service
    let res = next.call(req).await?;

    // post-processing

    Ok(res)
}


