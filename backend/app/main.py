from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .import models
from .config import settings
from .database import Base,engine
from .routers import customer,dashboard,orders,products
from contextlib import asynccontextmanager

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Create database tables
    Base.metadata.create_all(bind=engine)
    yield
    # Perform any cleanup tasks here if needed

app = FastAPI(
    title="Inventory Management System",
    version="1.0.0",
    lifespan=lifespan
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,  
    allow_methods=["*"],  
    allow_headers=["*"],  
)

app.include_router(customer.router)
app.include_router(dashboard.router)
app.include_router(orders.router)
app.include_router(products.router)

@app.get("/health",tags=["meta"])
async def health_check():
    return {"status": "ok"}
