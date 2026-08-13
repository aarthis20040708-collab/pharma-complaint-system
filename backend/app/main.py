from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.database import engine, Base, get_db
from app.seed_data import init_db, seed_pharma_data
from app.routes import products, complaints, ai_agent
from sqlalchemy.orm import Session

# Initialize Database tables and pre-seeded pharma data
init_db()
seed_pharma_data()

app = FastAPI(
    title="Pharma QMS Complaint Management API",
    description="AI-Powered Customer Complaint Management System for Pharmaceutical Manufacturing (API & FDF)",
    version="1.0.0"
)

# Configure CORS for React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API Routers
app.include_router(products.router)
app.include_router(complaints.router)
app.include_router(ai_agent.router)

@app.get("/")
def read_root():
    return {
        "status": "online",
        "system": "Pharma QMS Customer Complaint Engine",
        "primary_model": settings.PRIMARY_MODEL,
        "reasoning_model": settings.REASONING_MODEL
    }

@app.get("/api/health")
def health_check(db: Session = Depends(get_db)):
    has_groq_key = bool(settings.GROQ_API_KEY and settings.GROQ_API_KEY != "gsk_your_groq_api_key_here")
    from app.models import Product, Complaint
    product_count = db.query(Product).count()
    complaint_count = db.query(Complaint).count()
    
    return {
        "status": "healthy",
        "groq_configured": has_groq_key,
        "database": "connected",
        "stats": {
            "products": product_count,
            "complaints": complaint_count
        }
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
