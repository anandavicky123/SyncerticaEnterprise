# Production Environment Configuration for Syncertica Enterprise

# Project Configuration
project_name = "syncertica-enterprise"
environment  = "production"
aws_region   = "us-east-1"

# Networking Configuration
vpc_cidr             = "10.0.0.0/16"
availability_zones   = ["us-east-1a", "us-east-1b", "us-east-1c"]
public_subnet_cidrs  = ["10.0.1.0/24", "10.0.2.0/24", "10.0.3.0/24"]
private_app_cidrs    = ["10.0.11.0/24", "10.0.12.0/24", "10.0.13.0/24"]
private_db_cidrs     = ["10.0.21.0/24", "10.0.22.0/24", "10.0.23.0/24"]

# Application Configuration
app_port        = 3000
app_cpu         = 1024
app_memory      = 2048
min_capacity    = 2
max_capacity    = 10
desired_capacity = 3

# Database Configuration
db_instance_class    = "db.r6g.xlarge"
db_allocated_storage = 500
db_backup_retention  = 30
db_multi_az         = true

# Cache Configuration
redis_node_type       = "cache.r6g.large"
redis_num_cache_nodes = 3

# Lambda Configuration
lambda_memory_size = 512
lambda_timeout     = 60

# Security Configuration
enable_encryption = true
enable_backup     = true
enable_monitoring = true

# Logging Configuration
log_retention_days = 30

# Domain Configuration
domain_name = "app.syncertica.com"
certificate_arn = "arn:aws:acm:us-east-1:123456789012:certificate/production-cert-id"

# Monitoring Configuration
enable_detailed_monitoring = true
cloudwatch_log_retention   = 30

# Auto Scaling Configuration
cpu_target_value    = 60.0
memory_target_value = 70.0
scale_up_cooldown   = 300
scale_down_cooldown = 600

# Backup Configuration
backup_schedule = "cron(0 2 * * ? *)"  # Daily at 2 AM UTC

# Performance Configuration
enable_performance_insights = true
performance_insights_retention = 30

# Tags
common_tags = {
  Project     = "Syncertica Enterprise"
  Environment = "production"
  Owner       = "DevOps Team"
  CostCenter  = "Engineering"
  Terraform   = "true"
  Backup      = "required"
  Monitoring  = "critical"
}
