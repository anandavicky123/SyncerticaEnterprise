# Staging Environment Configuration for Syncertica Enterprise

# Project Configuration
project_name = "syncertica-enterprise"
environment  = "staging"
aws_region   = "us-east-1"

# Networking Configuration
vpc_cidr             = "10.1.0.0/16"
availability_zones   = ["us-east-1a", "us-east-1b", "us-east-1c"]
public_subnet_cidrs  = ["10.1.1.0/24", "10.1.2.0/24", "10.1.3.0/24"]
private_app_cidrs    = ["10.1.11.0/24", "10.1.12.0/24", "10.1.13.0/24"]
private_db_cidrs     = ["10.1.21.0/24", "10.1.22.0/24", "10.1.23.0/24"]

# Application Configuration
app_port        = 3000
app_cpu         = 512
app_memory      = 1024
min_capacity    = 1
max_capacity    = 3
desired_capacity = 2

# Database Configuration
db_instance_class    = "db.r6g.large"
db_allocated_storage = 100
db_backup_retention  = 7
db_multi_az         = false

# Cache Configuration
redis_node_type       = "cache.t3.micro"
redis_num_cache_nodes = 1

# Lambda Configuration
lambda_memory_size = 256
lambda_timeout     = 30

# Security Configuration
enable_encryption = true
enable_backup     = true
enable_monitoring = true

# Logging Configuration
log_retention_days = 7

# Domain Configuration
domain_name = "staging.syncertica.com"
certificate_arn = "arn:aws:acm:us-east-1:123456789012:certificate/staging-cert-id"

# Monitoring Configuration
enable_detailed_monitoring = false
cloudwatch_log_retention   = 7

# Auto Scaling Configuration
cpu_target_value    = 70.0
memory_target_value = 80.0
scale_up_cooldown   = 300
scale_down_cooldown = 300

# Tags
common_tags = {
  Project     = "Syncertica Enterprise"
  Environment = "staging"
  Owner       = "DevOps Team"
  CostCenter  = "Engineering"
  Terraform   = "true"
}
