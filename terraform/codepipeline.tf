# AWS CodePipeline Configuration for Syncertica Enterprise
# This creates separate pipelines for staging and production environments

resource "aws_codepipeline" "syncertica_staging" {
  name     = "syncertica-enterprise-staging"
  role_arn = aws_iam_role.codepipeline_role.arn

  artifact_store {
    location = aws_s3_bucket.codepipeline_artifacts.bucket
    type     = "S3"

    encryption_key {
      id   = aws_kms_key.codepipeline_key.arn
      type = "KMS"
    }
  }

  stage {
    name = "Source"

    action {
      name             = "Source"
      category         = "Source"
      owner            = "AWS"
      provider         = "ECR"
      version          = "1"
      output_artifacts = ["source_output"]

      configuration = {
        RepositoryName = aws_ecr_repository.syncertica_enterprise.name
        ImageTag       = "staging-latest"
      }
    }
  }

  stage {
    name = "Deploy"

    action {
      name             = "Deploy"
      category         = "Deploy"
      owner            = "AWS"
      provider         = "ECS"
      version          = "1"
      input_artifacts  = ["source_output"]

      configuration = {
        ClusterName = aws_ecs_cluster.syncertica_staging.name
        ServiceName = aws_ecs_service.syncertica_staging.name
        FileName    = "imagedefinitions.json"
      }
    }
  }

  stage {
    name = "PostDeploy"

    action {
      name            = "HealthCheck"
      category        = "Invoke"
      owner           = "AWS"
      provider        = "Lambda"
      version         = "1"
      input_artifacts = ["source_output"]

      configuration = {
        FunctionName = aws_lambda_function.health_check.function_name
        UserParameters = jsonencode({
          environment = "staging"
          service_url = "https://${aws_lb.staging.dns_name}"
        })
      }
    }
  }
}

resource "aws_codepipeline" "syncertica_production" {
  name     = "syncertica-enterprise-production"
  role_arn = aws_iam_role.codepipeline_role.arn

  artifact_store {
    location = aws_s3_bucket.codepipeline_artifacts.bucket
    type     = "S3"

    encryption_key {
      id   = aws_kms_key.codepipeline_key.arn
      type = "KMS"
    }
  }

  stage {
    name = "Source"

    action {
      name             = "Source"
      category         = "Source"
      owner            = "AWS"
      provider         = "ECR"
      version          = "1"
      output_artifacts = ["source_output"]

      configuration = {
        RepositoryName = aws_ecr_repository.syncertica_enterprise.name
        ImageTag       = "latest"
      }
    }
  }

  stage {
    name = "Approval"

    action {
      name     = "ManualApproval"
      category = "Approval"
      owner    = "AWS"
      provider = "Manual"
      version  = "1"

      configuration = {
        NotificationArn    = aws_sns_topic.deployment_notifications.arn
        CustomData        = "Please review and approve production deployment"
        ExternalEntityLink = "https://github.com/anandavicky123/SyncerticaEnterprise"
      }
    }
  }

  stage {
    name = "BlueGreenDeploy"

    action {
      name             = "BlueGreenDeploy"
      category         = "Deploy"
      owner            = "AWS"
      provider         = "CodeDeployToECS"
      version          = "1"
      input_artifacts  = ["source_output"]

      configuration = {
        ApplicationName                = aws_codedeploy_app.syncertica_production.name
        DeploymentGroupName           = aws_codedeploy_deployment_group.syncertica_production.deployment_group_name
        TaskDefinitionTemplateArtifact = "source_output"
        AppSpecTemplateArtifact       = "source_output"
      }
    }
  }

  stage {
    name = "PostDeploy"

    action {
      name            = "HealthCheck"
      category        = "Invoke"
      owner           = "AWS"
      provider        = "Lambda"
      version         = "1"
      input_artifacts = ["source_output"]

      configuration = {
        FunctionName = aws_lambda_function.health_check.function_name
        UserParameters = jsonencode({
          environment = "production"
          service_url = "https://${aws_lb.production.dns_name}"
        })
      }
    }

    action {
      name            = "PerformanceTest"
      category        = "Invoke"
      owner           = "AWS"
      provider        = "Lambda"
      version         = "1"
      input_artifacts = ["source_output"]

      configuration = {
        FunctionName = aws_lambda_function.performance_test.function_name
        UserParameters = jsonencode({
          environment = "production"
          service_url = "https://${aws_lb.production.dns_name}"
          test_duration = "300"
        })
      }
    }
  }
}

# S3 Bucket for CodePipeline Artifacts
resource "aws_s3_bucket" "codepipeline_artifacts" {
  bucket        = "syncertica-enterprise-codepipeline-artifacts-${random_string.bucket_suffix.result}"
  force_destroy = true
}

resource "aws_s3_bucket_versioning" "codepipeline_artifacts" {
  bucket = aws_s3_bucket.codepipeline_artifacts.id
  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "codepipeline_artifacts" {
  bucket = aws_s3_bucket.codepipeline_artifacts.id

  rule {
    apply_server_side_encryption_by_default {
      kms_master_key_id = aws_kms_key.codepipeline_key.arn
      sse_algorithm     = "aws:kms"
    }
  }
}

# KMS Key for CodePipeline
resource "aws_kms_key" "codepipeline_key" {
  description             = "KMS key for Syncertica Enterprise CodePipeline"
  deletion_window_in_days = 7
}

resource "aws_kms_alias" "codepipeline_key" {
  name          = "alias/syncertica-enterprise-codepipeline"
  target_key_id = aws_kms_key.codepipeline_key.key_id
}

# Random suffix for unique bucket naming
resource "random_string" "bucket_suffix" {
  length  = 8
  special = false
  upper   = false
}

# IAM Role for CodePipeline
resource "aws_iam_role" "codepipeline_role" {
  name = "syncertica-enterprise-codepipeline-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "codepipeline.amazonaws.com"
        }
      }
    ]
  })
}

resource "aws_iam_role_policy" "codepipeline_policy" {
  name = "syncertica-enterprise-codepipeline-policy"
  role = aws_iam_role.codepipeline_role.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "s3:GetBucketVersioning",
          "s3:GetObject",
          "s3:GetObjectVersion",
          "s3:PutObject"
        ]
        Resource = [
          aws_s3_bucket.codepipeline_artifacts.arn,
          "${aws_s3_bucket.codepipeline_artifacts.arn}/*"
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "ecr:BatchCheckLayerAvailability",
          "ecr:GetDownloadUrlForLayer",
          "ecr:BatchGetImage",
          "ecr:DescribeImages",
          "ecr:DescribeRepositories"
        ]
        Resource = aws_ecr_repository.syncertica_enterprise.arn
      },
      {
        Effect = "Allow"
        Action = [
          "ecs:DescribeServices",
          "ecs:DescribeTaskDefinition",
          "ecs:DescribeTasks",
          "ecs:ListTasks",
          "ecs:RegisterTaskDefinition",
          "ecs:UpdateService"
        ]
        Resource = "*"
      },
      {
        Effect = "Allow"
        Action = [
          "codedeploy:CreateDeployment",
          "codedeploy:GetApplication",
          "codedeploy:GetApplicationRevision",
          "codedeploy:GetDeployment",
          "codedeploy:GetDeploymentConfig",
          "codedeploy:RegisterApplicationRevision"
        ]
        Resource = "*"
      },
      {
        Effect = "Allow"
        Action = [
          "lambda:InvokeFunction"
        ]
        Resource = [
          aws_lambda_function.health_check.arn,
          aws_lambda_function.performance_test.arn
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "sns:Publish"
        ]
        Resource = aws_sns_topic.deployment_notifications.arn
      },
      {
        Effect = "Allow"
        Action = [
          "kms:Decrypt",
          "kms:GenerateDataKey"
        ]
        Resource = aws_kms_key.codepipeline_key.arn
      }
    ]
  })
}

# SNS Topic for Deployment Notifications
resource "aws_sns_topic" "deployment_notifications" {
  name = "syncertica-enterprise-deployments"
}

# Lambda Function for Health Checks
resource "aws_lambda_function" "health_check" {
  filename         = "health_check.zip"
  function_name    = "syncertica-enterprise-health-check"
  role            = aws_iam_role.lambda_role.arn
  handler         = "index.handler"
  runtime         = "python3.9"
  timeout         = 60

  source_code_hash = data.archive_file.health_check_zip.output_base64sha256
}

# Lambda Function for Performance Testing
resource "aws_lambda_function" "performance_test" {
  filename         = "performance_test.zip"
  function_name    = "syncertica-enterprise-performance-test"
  role            = aws_iam_role.lambda_role.arn
  handler         = "index.handler"
  runtime         = "python3.9"
  timeout         = 900

  source_code_hash = data.archive_file.performance_test_zip.output_base64sha256
}

# Create ZIP files for Lambda functions
data "archive_file" "health_check_zip" {
  type        = "zip"
  output_path = "health_check.zip"
  source {
    content = file("${path.module}/lambda/health_check.py")
    filename = "index.py"
  }
}

data "archive_file" "performance_test_zip" {
  type        = "zip"
  output_path = "performance_test.zip"
  source {
    content = file("${path.module}/lambda/performance_test.py")
    filename = "index.py"
  }
}

# IAM Role for Lambda
resource "aws_iam_role" "lambda_role" {
  name = "syncertica-enterprise-lambda-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "lambda.amazonaws.com"
        }
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "lambda_basic" {
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
  role       = aws_iam_role.lambda_role.name
}

# CodeDeploy Application for Blue/Green Deployment
resource "aws_codedeploy_app" "syncertica_production" {
  compute_platform = "ECS"
  name             = "syncertica-enterprise-production"
}

resource "aws_codedeploy_deployment_group" "syncertica_production" {
  app_name              = aws_codedeploy_app.syncertica_production.name
  deployment_group_name = "syncertica-enterprise-production-dg"
  service_role_arn      = aws_iam_role.codedeploy_role.arn

  blue_green_deployment_config {
    terminate_blue_instances_on_deployment_success {
      action                         = "TERMINATE"
      termination_wait_time_in_minutes = 5
    }

    deployment_ready_option {
      action_on_timeout = "CONTINUE_DEPLOYMENT"
    }

    green_fleet_provisioning_option {
      action = "COPY_AUTO_SCALING_GROUP"
    }
  }

  ecs_service {
    cluster_name = aws_ecs_cluster.syncertica_production.name
    service_name = aws_ecs_service.syncertica_production.name
  }

  load_balancer_info {
    target_group_info {
      name = aws_lb_target_group.production.name
    }
  }
}

# IAM Role for CodeDeploy
resource "aws_iam_role" "codedeploy_role" {
  name = "syncertica-enterprise-codedeploy-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "codedeploy.amazonaws.com"
        }
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "codedeploy_ecs" {
  policy_arn = "arn:aws:iam::aws:policy/AWSCodeDeployRoleForECS"
  role       = aws_iam_role.codedeploy_role.name
}
