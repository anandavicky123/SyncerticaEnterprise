import json
import boto3
import os
from datetime import datetime, timezone
import logging

# Configure logging
logger = logging.getLogger()
logger.setLevel(logging.INFO)

# Initialize AWS clients
dynamodb = boto3.resource('dynamodb', region_name=os.environ.get('REGION', 'us-east-1'))
table = dynamodb.Table(os.environ.get('DYNAMODB_TABLE'))

def lambda_handler(event, context):
    """
    AWS Lambda handler for Syncertica Enterprise data processing
    """
    logger.info(f"Event: {json.dumps(event)}")
    
    try:
        # Handle different event sources
        if 'httpMethod' in event:
            # API Gateway event
            return handle_api_gateway(event, context)
        elif 'Records' in event:
            # DynamoDB stream or other AWS service events
            return handle_records(event, context)
        else:
            # Direct invocation
            return handle_direct_invocation(event, context)
            
    except Exception as e:
        logger.error(f"Error processing event: {str(e)}")
        return {
            'statusCode': 500,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({
                'error': 'Internal server error',
                'message': str(e)
            })
        }

def handle_api_gateway(event, context):
    """Handle API Gateway requests"""
    method = event.get('httpMethod')
    path = event.get('path', '')
    
    logger.info(f"API Gateway {method} request to {path}")
    
    # CORS preflight
    if method == 'OPTIONS':
        return cors_response()
    
    # Route requests
    if path == '/health':
        return health_check()
    elif path == '/analytics' and method == 'POST':
        return create_analytics_event(event)
    elif path == '/analytics' and method == 'GET':
        return get_analytics_data(event)
    elif path == '/session' and method == 'POST':
        return create_session(event)
    elif path == '/session' and method == 'GET':
        return get_session(event)
    else:
        return {
            'statusCode': 404,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({'error': 'Not found'})
        }

def handle_records(event, context):
    """Handle DynamoDB stream or other AWS service events"""
    logger.info(f"Processing {len(event['Records'])} records")
    
    processed = 0
    for record in event['Records']:
        try:
            # Process each record
            if record.get('eventSource') == 'aws:dynamodb':
                process_dynamodb_record(record)
            processed += 1
        except Exception as e:
            logger.error(f"Error processing record: {str(e)}")
    
    return {
        'statusCode': 200,
        'processedRecords': processed
    }

def handle_direct_invocation(event, context):
    """Handle direct Lambda invocation"""
    action = event.get('action', 'unknown')
    
    logger.info(f"Direct invocation with action: {action}")
    
    if action == 'health':
        return health_check()
    elif action == 'cleanup':
        return cleanup_expired_sessions()
    elif action == 'analytics':
        return generate_analytics_report(event.get('data', {}))
    else:
        return {
            'statusCode': 400,
            'body': json.dumps({'error': f'Unknown action: {action}'})
        }

def cors_response():
    """Return CORS preflight response"""
    return {
        'statusCode': 200,
        'headers': {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token',
            'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS'
        },
        'body': ''
    }

def health_check():
    """Health check endpoint"""
    try:
        # Test DynamoDB connection
        table.scan(Limit=1)
        
        return {
            'statusCode': 200,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({
                'status': 'healthy',
                'service': 'syncertica-enterprise',
                'timestamp': datetime.now(timezone.utc).isoformat(),
                'version': '1.0.0',
                'environment': os.environ.get('ENVIRONMENT', 'unknown')
            })
        }
    except Exception as e:
        return {
            'statusCode': 503,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({
                'status': 'unhealthy',
                'error': str(e),
                'timestamp': datetime.now(timezone.utc).isoformat()
            })
        }

def create_analytics_event(event):
    """Create analytics event"""
    try:
        body = json.loads(event.get('body', '{}'))
        
        # Validate required fields
        required_fields = ['user_id', 'event_type']
        for field in required_fields:
            if not body.get(field):
                return {
                    'statusCode': 400,
                    'headers': {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*'
                    },
                    'body': json.dumps({'error': f'Missing required field: {field}'})
                }
        
        # Create analytics record
        timestamp = datetime.now(timezone.utc)
        item = {
            'pk': f"ANALYTICS#{body['user_id']}",
            'sk': f"{body['event_type']}#{timestamp.isoformat()}",
            'GSI1PK': f"EVENT#{body['event_type']}",
            'GSI1SK': timestamp.isoformat(),
            'user_id': body['user_id'],
            'event_type': body['event_type'],
            'properties': body.get('properties', {}),
            'timestamp': timestamp.isoformat(),
            'ttl': int(timestamp.timestamp()) + (90 * 24 * 60 * 60)  # 90 days TTL
        }
        
        table.put_item(Item=item)
        
        return {
            'statusCode': 201,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({
                'success': True,
                'event_id': f"{item['pk']}#{item['sk']}",
                'timestamp': item['timestamp']
            })
        }
        
    except json.JSONDecodeError:
        return {
            'statusCode': 400,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({'error': 'Invalid JSON in request body'})
        }
    except Exception as e:
        logger.error(f"Error creating analytics event: {str(e)}")
        raise

def get_analytics_data(event):
    """Get analytics data"""
    try:
        params = event.get('queryStringParameters') or {}
        user_id = params.get('user_id')
        event_type = params.get('event_type')
        limit = int(params.get('limit', 50))
        
        if user_id:
            # Query by user ID
            response = table.query(
                KeyConditionExpression='pk = :pk',
                ExpressionAttributeValues={
                    ':pk': f"ANALYTICS#{user_id}"
                },
                Limit=limit,
                ScanIndexForward=False  # Get most recent first
            )
        elif event_type:
            # Query by event type using GSI
            response = table.query(
                IndexName='GSI1',
                KeyConditionExpression='GSI1PK = :gsi1pk',
                ExpressionAttributeValues={
                    ':gsi1pk': f"EVENT#{event_type}"
                },
                Limit=limit,
                ScanIndexForward=False
            )
        else:
            return {
                'statusCode': 400,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps({'error': 'user_id or event_type parameter required'})
            }
        
        return {
            'statusCode': 200,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({
                'events': response['Items'],
                'count': response['Count'],
                'lastEvaluatedKey': response.get('LastEvaluatedKey')
            })
        }
        
    except Exception as e:
        logger.error(f"Error getting analytics data: {str(e)}")
        raise

def create_session(event):
    """Create user session"""
    try:
        body = json.loads(event.get('body', '{}'))
        
        session_id = body.get('session_id')
        user_id = body.get('user_id')
        
        if not session_id or not user_id:
            return {
                'statusCode': 400,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps({'error': 'session_id and user_id required'})
            }
        
        timestamp = datetime.now(timezone.utc)
        expires = timestamp.timestamp() + (24 * 60 * 60)  # 24 hours
        
        item = {
            'pk': f"SESSION#{session_id}",
            'sk': 'METADATA',
            'GSI1PK': f"USER#{user_id}",
            'GSI1SK': timestamp.isoformat(),
            'session_id': session_id,
            'user_id': user_id,
            'created_at': timestamp.isoformat(),
            'expires': int(expires),
            'data': body.get('data', {})
        }
        
        table.put_item(Item=item)
        
        return {
            'statusCode': 201,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({
                'success': True,
                'session_id': session_id,
                'expires': int(expires)
            })
        }
        
    except Exception as e:
        logger.error(f"Error creating session: {str(e)}")
        raise

def get_session(event):
    """Get session data"""
    try:
        params = event.get('queryStringParameters') or {}
        session_id = params.get('session_id')
        
        if not session_id:
            return {
                'statusCode': 400,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps({'error': 'session_id parameter required'})
            }
        
        response = table.get_item(
            Key={
                'pk': f"SESSION#{session_id}",
                'sk': 'METADATA'
            }
        )
        
        if 'Item' not in response:
            return {
                'statusCode': 404,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps({'error': 'Session not found'})
            }
        
        return {
            'statusCode': 200,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({
                'session': response['Item']
            })
        }
        
    except Exception as e:
        logger.error(f"Error getting session: {str(e)}")
        raise

def process_dynamodb_record(record):
    """Process DynamoDB stream record"""
    event_name = record['eventName']
    
    if event_name in ['INSERT', 'MODIFY']:
        # Process analytics events for real-time insights
        dynamodb_data = record['dynamodb']
        
        if 'NewImage' in dynamodb_data:
            pk = dynamodb_data['NewImage'].get('pk', {}).get('S', '')
            
            if pk.startswith('ANALYTICS#'):
                # Real-time analytics processing
                logger.info(f"Processing analytics event: {pk}")
                # Add custom analytics logic here
    
    logger.info(f"Processed DynamoDB {event_name} event")

def cleanup_expired_sessions():
    """Clean up expired sessions"""
    try:
        current_time = int(datetime.now(timezone.utc).timestamp())
        
        # Scan for expired sessions
        response = table.scan(
            FilterExpression='attribute_exists(expires) AND expires < :current_time',
            ExpressionAttributeValues={
                ':current_time': current_time
            }
        )
        
        deleted_count = 0
        for item in response['Items']:
            table.delete_item(
                Key={
                    'pk': item['pk'],
                    'sk': item['sk']
                }
            )
            deleted_count += 1
        
        logger.info(f"Cleaned up {deleted_count} expired sessions")
        
        return {
            'statusCode': 200,
            'body': json.dumps({
                'cleaned_sessions': deleted_count
            })
        }
        
    except Exception as e:
        logger.error(f"Error cleaning up sessions: {str(e)}")
        raise

def generate_analytics_report(data):
    """Generate analytics report"""
    try:
        # Sample analytics report generation
        end_time = datetime.now(timezone.utc)
        start_time = datetime(end_time.year, end_time.month, end_time.day - 7, tzinfo=timezone.utc)
        
        # This is a simplified example - in production, you'd implement
        # more sophisticated analytics queries
        
        return {
            'statusCode': 200,
            'body': json.dumps({
                'report': {
                    'period': {
                        'start': start_time.isoformat(),
                        'end': end_time.isoformat()
                    },
                    'summary': {
                        'total_events': 0,  # Implement actual counting
                        'unique_users': 0,  # Implement actual counting
                        'top_events': []    # Implement actual aggregation
                    },
                    'generated_at': end_time.isoformat()
                }
            })
        }
        
    except Exception as e:
        logger.error(f"Error generating analytics report: {str(e)}")
        raise
