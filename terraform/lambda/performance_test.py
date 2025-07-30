import json
import urllib.request
import time
import boto3
from datetime import datetime
import ssl
import socket
from urllib.parse import urlparse

def handler(event, context):
    """
    Performance Test Lambda Function for Syncertica Enterprise
    Performs load testing and performance validation after deployment
    """
    
    # Parse input parameters
    user_params = json.loads(event.get('CodePipeline.job', {}).get('data', {}).get('actionConfiguration', {}).get('configuration', {}).get('UserParameters', '{}'))
    environment = user_params.get('environment', 'unknown')
    service_url = user_params.get('service_url', '')
    test_duration = int(user_params.get('test_duration', 300))  # 5 minutes default
    
    codepipeline = boto3.client('codepipeline')
    job_id = event.get('CodePipeline.job', {}).get('id')
    
    try:
        print(f"Starting performance test for {environment} environment")
        print(f"Target URL: {service_url}")
        print(f"Test Duration: {test_duration} seconds")
        
        # Performance test configuration
        concurrent_users = 10 if environment == 'production' else 5
        requests_per_user = test_duration // 10  # One request every 10 seconds per user
        
        results = {
            'environment': environment,
            'service_url': service_url,
            'test_duration': test_duration,
            'concurrent_users': concurrent_users,
            'timestamp': datetime.utcnow().isoformat(),
            'response_times': [],
            'status_codes': {},
            'errors': [],
            'metrics': {}
        }
        
        print(f"📊 Running load test with {concurrent_users} concurrent users")
        
        # Simulate load testing
        start_time = time.time()
        total_requests = 0
        successful_requests = 0
        failed_requests = 0
        response_times = []
        
        # Run test for specified duration
        while (time.time() - start_time) < test_duration:
            batch_start = time.time()
            
            # Simulate concurrent requests
            for user in range(concurrent_users):
                try:
                    request_start = time.time()
                    
                    # Make HTTP request
                    request = urllib.request.Request(service_url)
                    request.add_header('User-Agent', f'SyncerticaEnterprise-LoadTest-User{user}')
                    
                    with urllib.request.urlopen(request, timeout=30) as response:
                        response_time = time.time() - request_start
                        status_code = response.getcode()
                        
                        response_times.append(response_time)
                        
                        # Track status codes
                        if str(status_code) in results['status_codes']:
                            results['status_codes'][str(status_code)] += 1
                        else:
                            results['status_codes'][str(status_code)] = 1
                        
                        if status_code == 200:
                            successful_requests += 1
                        else:
                            failed_requests += 1
                        
                        total_requests += 1
                        
                except Exception as e:
                    failed_requests += 1
                    total_requests += 1
                    results['errors'].append({
                        'timestamp': datetime.utcnow().isoformat(),
                        'error': str(e),
                        'user': user
                    })
                
                # Small delay between requests from same user
                time.sleep(0.1)
            
            # Wait before next batch (10 second intervals)
            batch_duration = time.time() - batch_start
            if batch_duration < 10:
                time.sleep(10 - batch_duration)
        
        # Calculate metrics
        if response_times:
            response_times.sort()
            results['metrics'] = {
                'total_requests': total_requests,
                'successful_requests': successful_requests,
                'failed_requests': failed_requests,
                'success_rate': (successful_requests / total_requests) * 100 if total_requests > 0 else 0,
                'avg_response_time': sum(response_times) / len(response_times),
                'min_response_time': min(response_times),
                'max_response_time': max(response_times),
                'p50_response_time': response_times[len(response_times) // 2],
                'p95_response_time': response_times[int(len(response_times) * 0.95)],
                'p99_response_time': response_times[int(len(response_times) * 0.99)],
                'requests_per_second': total_requests / test_duration,
                'errors_per_minute': (failed_requests / test_duration) * 60
            }
        
        # Store sample response times (limit to 100 for storage)
        results['response_times'] = response_times[:100]
        
        # Determine test result
        success_rate = results['metrics'].get('success_rate', 0)
        avg_response_time = results['metrics'].get('avg_response_time', 0)
        p95_response_time = results['metrics'].get('p95_response_time', 0)
        
        # Performance thresholds
        performance_criteria = {
            'min_success_rate': 95.0,  # 95% success rate
            'max_avg_response_time': 2.0,  # 2 seconds average
            'max_p95_response_time': 5.0   # 5 seconds P95
        }
        
        test_passed = (
            success_rate >= performance_criteria['min_success_rate'] and
            avg_response_time <= performance_criteria['max_avg_response_time'] and
            p95_response_time <= performance_criteria['max_p95_response_time']
        )
        
        results['test_result'] = 'PASS' if test_passed else 'FAIL'
        results['performance_criteria'] = performance_criteria
        
        # Performance summary
        print(f"🎯 Performance Test Results:")
        print(f"   Total Requests: {total_requests}")
        print(f"   Success Rate: {success_rate:.1f}%")
        print(f"   Average Response Time: {avg_response_time:.2f}s")
        print(f"   P95 Response Time: {p95_response_time:.2f}s")
        print(f"   Requests/Second: {results['metrics'].get('requests_per_second', 0):.2f}")
        print(f"   Test Result: {results['test_result']}")
        
        # Report to CodePipeline
        if job_id:
            if test_passed:
                codepipeline.put_job_success_result(
                    jobId=job_id,
                    outputVariables={
                        'TestResult': results['test_result'],
                        'SuccessRate': str(success_rate),
                        'AvgResponseTime': str(avg_response_time)
                    }
                )
            else:
                failure_message = f"Performance test failed: Success rate {success_rate:.1f}%, Avg response time {avg_response_time:.2f}s"
                codepipeline.put_job_failure_result(
                    jobId=job_id,
                    failureDetails={'message': failure_message, 'type': 'JobFailed'}
                )
        
        return {
            'statusCode': 200,
            'body': json.dumps(results, indent=2, default=str)
        }
        
    except Exception as e:
        error_result = {
            'environment': environment,
            'service_url': service_url,
            'timestamp': datetime.utcnow().isoformat(),
            'test_result': 'ERROR',
            'error': str(e)
        }
        
        print(f"❌ Performance test error: {str(e)}")
        
        # Report failure to CodePipeline
        if job_id:
            codepipeline.put_job_failure_result(
                jobId=job_id,
                failureDetails={'message': f'Performance test error: {str(e)}', 'type': 'JobFailed'}
            )
        
        return {
            'statusCode': 500,
            'body': json.dumps(error_result, indent=2)
        }
