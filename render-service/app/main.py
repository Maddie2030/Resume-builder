
# render-service/app/main.py

from fastapi import FastAPI, status
from app.routers.render import router as render_router
from fastapi.responses import JSONResponse

app = FastAPI(
    title="Render Service API",
    description="A microservice for generating rendered documents and images from templates."
)

app.include_router(render_router)

@app.get("/")
def read_root():
    return {"message": "Hello, World! Render Service is up and running."}

@app.get("/health", status_code=status.HTTP_200_OK)
def health_check():
    """
    Health check endpoint to verify the service is running.
    """
    return JSONResponse(content={"status": "ok"})