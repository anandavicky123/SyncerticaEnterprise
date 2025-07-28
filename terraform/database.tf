# Aurora DSQL Database Infrastructure

# Random password for Aurora master user
resource "random_password" "aurora_master_password" {
  length  = 16
  special = true
}

# AWS Secrets Manager for database credentials
resource "aws_secretsmanager_secret" "aurora_credentials" {
  name                    = "${var.project_name}-${var.environment}-aurora-credentials"
  description             = "Aurora DSQL credentials for Syncertica Enterprise"
  recovery_window_in_days = var.backup_retention_period
}

resource "aws_secretsmanager_secret_version" "aurora_credentials" {
  secret_id = aws_secretsmanager_secret.aurora_credentials.id
  secret_string = jsonencode({
    username = var.db_username
    password = random_password.aurora_master_password.result
    engine   = "aurora-postgresql"
    host     = aws_rds_cluster.aurora.endpoint
    port     = 5432
    dbname   = aws_rds_cluster.aurora.database_name
  })
}

# DB Subnet Group
resource "aws_db_subnet_group" "aurora" {
  name       = "${var.project_name}-${var.environment}-aurora-subnet-group"
  subnet_ids = aws_subnet.private_db[*].id

  tags = {
    Name = "${var.project_name}-${var.environment}-aurora-subnet-group"
  }
}

# Aurora PostgreSQL Cluster
resource "aws_rds_cluster" "aurora" {
  cluster_identifier              = "${var.project_name}-${var.environment}-aurora-cluster"
  engine                         = "aurora-postgresql"
  engine_version                 = var.db_engine_version
  database_name                  = replace("${var.project_name}_${var.environment}", "-", "_")
  master_username                = var.db_username
  master_password                = random_password.aurora_master_password.result
  backup_retention_period        = var.backup_retention_period
  preferred_backup_window        = "07:00-09:00"
  preferred_maintenance_window   = "wed:03:00-wed:04:00"
  db_subnet_group_name          = aws_db_subnet_group.aurora.name
  vpc_security_group_ids        = [aws_security_group.aurora.id]
  storage_encrypted             = var.enable_encryption
  kms_key_id                    = var.enable_encryption ? aws_kms_key.aurora[0].arn : null
  deletion_protection           = var.environment == "prod" ? true : false
  skip_final_snapshot           = var.environment != "prod"
  final_snapshot_identifier     = var.environment == "prod" ? "${var.project_name}-${var.environment}-final-snapshot" : null
  
  # Enable DSQL features
  enable_global_write_forwarding = true
  
  # Performance Insights
  performance_insights_enabled          = var.enable_detailed_monitoring
  performance_insights_retention_period = var.enable_detailed_monitoring ? 7 : null
  
  # CloudWatch Logs
  enabled_cloudwatch_logs_exports = ["postgresql"]
  
  # Enhanced Monitoring
  monitoring_interval = var.enable_detailed_monitoring ? 60 : 0
  monitoring_role_arn = var.enable_detailed_monitoring ? aws_iam_role.aurora_monitoring[0].arn : null

  tags = {
    Name = "${var.project_name}-${var.environment}-aurora-cluster"
  }

  depends_on = [
    aws_cloudwatch_log_group.aurora
  ]
}

# Aurora Cluster Instances
resource "aws_rds_cluster_instance" "aurora_instances" {
  count = var.enable_multi_az ? 2 : 1

  identifier                   = "${var.project_name}-${var.environment}-aurora-instance-${count.index + 1}"
  cluster_identifier          = aws_rds_cluster.aurora.id
  instance_class              = var.db_instance_class
  engine                      = aws_rds_cluster.aurora.engine
  engine_version              = aws_rds_cluster.aurora.engine_version
  publicly_accessible        = false
  db_subnet_group_name        = aws_db_subnet_group.aurora.name
  monitoring_interval         = var.enable_detailed_monitoring ? 60 : 0
  monitoring_role_arn         = var.enable_detailed_monitoring ? aws_iam_role.aurora_monitoring[0].arn : null
  performance_insights_enabled = var.enable_detailed_monitoring

  tags = {
    Name = "${var.project_name}-${var.environment}-aurora-instance-${count.index + 1}"
  }
}

# KMS Key for Aurora encryption
resource "aws_kms_key" "aurora" {
  count = var.enable_encryption ? 1 : 0

  description             = "KMS key for Aurora encryption in ${var.project_name}-${var.environment}"
  deletion_window_in_days = 7

  tags = {
    Name = "${var.project_name}-${var.environment}-aurora-kms-key"
  }
}

resource "aws_kms_alias" "aurora" {
  count = var.enable_encryption ? 1 : 0

  name          = "alias/${var.project_name}-${var.environment}-aurora"
  target_key_id = aws_kms_key.aurora[0].key_id
}

# CloudWatch Log Group for Aurora
resource "aws_cloudwatch_log_group" "aurora" {
  name              = "/aws/rds/cluster/${var.project_name}-${var.environment}-aurora-cluster/postgresql"
  retention_in_days = var.log_retention_days

  tags = {
    Name = "${var.project_name}-${var.environment}-aurora-logs"
  }
}

# Enhanced Monitoring Role for Aurora
resource "aws_iam_role" "aurora_monitoring" {
  count = var.enable_detailed_monitoring ? 1 : 0

  name = "${var.project_name}-${var.environment}-aurora-monitoring-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "monitoring.rds.amazonaws.com"
        }
      }
    ]
  })

  tags = {
    Name = "${var.project_name}-${var.environment}-aurora-monitoring-role"
  }
}

resource "aws_iam_role_policy_attachment" "aurora_monitoring" {
  count = var.enable_detailed_monitoring ? 1 : 0

  role       = aws_iam_role.aurora_monitoring[0].name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonRDSEnhancedMonitoringRole"
}

# ElastiCache Redis Subnet Group
resource "aws_elasticache_subnet_group" "redis" {
  name       = "${var.project_name}-${var.environment}-redis-subnet-group"
  subnet_ids = aws_subnet.private_db[*].id

  tags = {
    Name = "${var.project_name}-${var.environment}-redis-subnet-group"
  }
}

# ElastiCache Redis Cluster
resource "aws_elasticache_replication_group" "redis" {
  replication_group_id         = "${var.project_name}-${var.environment}-redis"
  description                  = "Redis cluster for ${var.project_name} ${var.environment}"
  
  node_type                    = "cache.r6g.large"
  port                         = 6379
  parameter_group_name         = "default.redis7"
  
  num_cache_clusters           = var.enable_multi_az ? 2 : 1
  automatic_failover_enabled   = var.enable_multi_az
  multi_az_enabled            = var.enable_multi_az
  
  subnet_group_name           = aws_elasticache_subnet_group.redis.name
  security_group_ids          = [aws_security_group.redis.id]
  
  at_rest_encryption_enabled  = var.enable_encryption
  transit_encryption_enabled  = var.enable_encryption
  
  snapshot_retention_limit    = var.backup_retention_period
  snapshot_window             = "03:00-05:00"
  maintenance_window          = "wed:05:00-wed:06:00"
  
  log_delivery_configuration {
    destination      = aws_cloudwatch_log_group.redis.name
    destination_type = "cloudwatch-logs"
    log_format       = "text"
    log_type         = "slow-log"
  }

  tags = {
    Name = "${var.project_name}-${var.environment}-redis"
  }
}

# CloudWatch Log Group for Redis
resource "aws_cloudwatch_log_group" "redis" {
  name              = "/aws/elasticache/redis/${var.project_name}-${var.environment}"
  retention_in_days = var.log_retention_days

  tags = {
    Name = "${var.project_name}-${var.environment}-redis-logs"
  }
}
