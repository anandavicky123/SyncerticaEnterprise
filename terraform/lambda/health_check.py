import json
import urllib3
import time
import boto3
from datetime import datetime

def handler(event, context):
    """
    Health Check Lambda Function for Syncertica Enterprise
    Performs comprehensive health checks after deployment
    """
    
    # Parse input parameters
    user_params = json.loads(event.get('CodePipeline.job', {}).get('data', {}).get('actionConfiguration', {}).get('configuration', {}).get('UserParameters', '{}'))
    environment = user_params.get('environment', 'unknown')
    service_url = user_params.get('service_url', '')
    
    http = urllib3.PoolManager()
    codepipeline = boto3.client('codepipeline')
    job_id = event.get('CodePipeline.job', {}).get('id')
    
    health_checks = []
    overall_success = True
    
    try:
        print(f"Starting health checks for {environment} environment at {service_url}")
        
        # 1. Basic connectivity check
        print("🔍 Checking basic connectivity...")
        start_time = time.time()
        try:
            response = http.request('GET', service_url, timeout=30)
            connectivity_time = time.time() - start_time
            
            health_checks.append({
                'check': 'connectivity',
                'status': 'PASS' if response.status == 200 else 'FAIL',
                'response_code': response.status,
                'response_time': round(connectivity_time, 2),
                'details': f"HTTP {response.status} in {connectivity_time:.2f}s"
            })
            
            if response.status != 200:
                overall_success = False
                
        except Exception as e:
            health_checks.append({
                'check': 'connectivity',
                'status': 'FAIL',
                'error': str(e),
                'details': 'Failed to connect to service'
            })
            overall_success = False
        
        # 2. Health endpoint check
        print("🏥 Checking health endpoint...")
        try:
            health_url = f"{service_url}/api/health"
            response = http.request('GET', health_url, timeout=15)
            
            health_checks.append({
                'check': 'health_endpoint',
                'status': 'PASS' if response.status == 200 else 'FAIL',
                'response_code': response.status,
                'details': f"Health endpoint returned {response.status}"
            })
            
            if response.status != 200:
                overall_success = False
                
        except Exception as e:
            health_checks.append({
                'check': 'health_endpoint',
                'status': 'WARN',
                'error': str(e),
                'details': 'Health endpoint not available (optional)'
            })
        
        # 3. Performance baseline check
        print("⚡ Checking performance baseline...")
        response_times = []
        for i in range(5):
            try:
                start_time = time.time()
                response = http.request('GET', service_url, timeout=10)
                response_time = time.time() - start_time
                response_times.append(response_time)
                time.sleep(1)
            except:
                response_times.append(10.0)  # Timeout fallback
        
        avg_response_time = sum(response_times) / len(response_times)
        max_response_time = max(response_times)
        
        performance_status = 'PASS'
        if avg_response_time > 3.0:
            performance_status = 'WARN'
            if avg_response_time > 5.0:
                performance_status = 'FAIL'
                overall_success = False
        
        health_checks.append({
            'check': 'performance_baseline',
            'status': performance_status,
            'avg_response_time': round(avg_response_time, 2),
            'max_response_time': round(max_response_time, 2),
            'details': f"Average: {avg_response_time:.2f}s, Max: {max_response_time:.2f}s"
        })
        
        # 4. SSL/TLS check (if HTTPS)
        if service_url.startswith('https://'):
            print("🔒 Checking SSL/TLS...")
            try:
                import ssl
                import socket
                from urllib.parse import urlparse
                
                parsed_url = urlparse(service_url)
                context = ssl.create_default_context()
                
                with socket.create_connection((parsed_url.hostname, 443), timeout=10) as sock:
                    with context.wrap_socket(sock, server_hostname=parsed_url.hostname) as ssock:
                        cert = ssock.getpeercert()
                        
                health_checks.append({
                    'check': 'ssl_tls',
                    'status': 'PASS',
                    'certificate_subject': cert.get('subject', []),
                    'details': 'SSL/TLS certificate is valid'
                })
                
            except Exception as e:
                health_checks.append({
                    'check': 'ssl_tls',
                    'status': 'FAIL',
                    'error': str(e),
                    'details': 'SSL/TLS check failed'
                })
                overall_success = False
        
        # Prepare results
        result = {
            'environment': environment,
            'service_url': service_url,
            'timestamp': datetime.utcnow().isoformat(),
            'overall_status': 'PASS' if overall_success else 'FAIL',
            'health_checks': health_checks,
            'summary': {
                'total_checks': len(health_checks),
                'passed': len([c for c in health_checks if c['status'] == 'PASS']),
                'warnings': len([c for c in health_checks if c['status'] == 'WARN']),
                'failed': len([c for c in health_checks if c['status'] == 'FAIL'])
            }
        }
        
        print(f"✅ Health check completed: {result['overall_status']}")
        print(f"📊 Summary: {result['summary']}")
        
        # Report success to CodePipeline
        if job_id:
            if overall_success:
                codepipeline.put_job_success_result(jobId=job_id)
            else:
                codepipeline.put_job_failure_result(
                    jobId=job_id,
                    failureDetails={'message': 'Health checks failed', 'type': 'JobFailed'}
                )
        
        return {
            'statusCode': 200,
            'body': json.dumps(result, indent=2)
        }
        
    except Exception as e:
        error_result = {
            'environment': environment,
            'service_url': service_url,
            'timestamp': datetime.utcnow().isoformat(),
            'overall_status': 'ERROR',
            'error': str(e),
            'health_checks': health_checks
        }
        
        print(f"❌ Health check error: {str(e)}")
        
        # Report failure to CodePipeline
        if job_id:
            codepipeline.put_job_failure_result(
                jobId=job_id,
                failureDetails={'message': f'Health check error: {str(e)}', 'type': 'JobFailed'}
            )
        
        return {
            'statusCode': 500,
            'body': json.dumps(error_result, indent=2)
        }
