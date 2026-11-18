import os
from datetime import timedelta

class Config:
    SECRET_KEY = os.environ.get('SECRET_KEY', 'medtrack-super-secret-key-production-grade-2026')
    JWT_SECRET_KEY = os.environ.get('JWT_SECRET_KEY', 'medtrack-jwt-secret-token-key-2026')
    JWT_EXPIRATION_HOURS = int(os.environ.get('JWT_EXPIRATION_HOURS', '24'))
    
    # Database
    basedir = os.path.abspath(os.path.dirname(__file__))
    SQLALCHEMY_DATABASE_URI = os.environ.get(
        'DATABASE_URL', 
        f"sqlite:///{os.path.join(basedir, '..', 'medtrack.db')}"
    )
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    
    # CORS
    CORS_ORIGINS = os.environ.get('CORS_ORIGINS', '*').split(',')
    
    # Default Bootstrap Credentials for initial setup (Override in production via env)
    SUPERADMIN_ID = os.environ.get('SUPERADMIN_ID', 'superadmin')
    SUPERADMIN_PASSWORD = os.environ.get('SUPERADMIN_PASSWORD', 'SuperAdmin@MedTrack2026')

class DevelopmentConfig(Config):
    DEBUG = True

class TestingConfig(Config):
    TESTING = True
    SQLALCHEMY_DATABASE_URI = 'sqlite:///:memory:'
    WTF_CSRF_ENABLED = False
    JWT_EXPIRATION_HOURS = 1

class ProductionConfig(Config):
    DEBUG = False

config_by_name = {
    'development': DevelopmentConfig,
    'testing': TestingConfig,
    'production': ProductionConfig,
    'default': DevelopmentConfig
}
