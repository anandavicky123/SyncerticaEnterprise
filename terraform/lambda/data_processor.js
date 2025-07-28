import AWS from "aws-sdk";

// Initialize AWS services
const dynamodb = new AWS.DynamoDB.DocumentClient({
  region: process.env.REGION || "us-east-1",
});

const sns = new AWS.SNS({
  region: process.env.REGION || "us-east-1",
});

// Lambda handler function
exports.handler = async (event, context) => {
  console.log("Event:", JSON.stringify(event, null, 2));

  try {
    // Handle different event sources
    if (event.Records) {
      // Handle DynamoDB stream events
      return await handleDynamoDBStream(event);
    } else if (event.httpMethod) {
      // Handle API Gateway events
      return await handleAPIGateway(event);
    } else {
      // Handle direct Lambda invocation
      return await handleDirectInvocation(event);
    }
  } catch (error) {
    console.error("Error processing event:", error);

    return {
      statusCode: 500,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "Content-Type",
        "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
      },
      body: JSON.stringify({
        error: "Internal server error",
        message: error.message,
      }),
    };
  }
};

// Handle DynamoDB stream events
async function handleDynamoDBStream(event) {
  console.log("Processing DynamoDB stream events");

  for (const record of event.Records) {
    const { eventName, dynamodb } = record;

    console.log(`Processing ${eventName} event:`, dynamodb);

    if (eventName === "INSERT" || eventName === "MODIFY") {
      // Process analytics data
      await processAnalyticsEvent(dynamodb.NewImage);
    }
  }

  return { processedRecords: event.Records.length };
}

// Handle API Gateway events
async function handleAPIGateway(event) {
  const { httpMethod, path, body, headers } = event;

  console.log(`Processing API Gateway ${httpMethod} request to ${path}`);

  // CORS preflight
  if (httpMethod === "OPTIONS") {
    return {
      statusCode: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "Content-Type",
        "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
      },
      body: "",
    };
  }

  let responseBody;

  switch (path) {
    case "/analytics":
      if (httpMethod === "POST") {
        responseBody = await createAnalyticsEvent(JSON.parse(body || "{}"));
      } else if (httpMethod === "GET") {
        responseBody = await getAnalyticsData(event.queryStringParameters);
      }
      break;

    case "/health":
      responseBody = await healthCheck();
      break;

    default:
      return {
        statusCode: 404,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
        body: JSON.stringify({ error: "Not found" }),
      };
  }

  return {
    statusCode: 200,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Headers": "Content-Type",
      "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
    },
    body: JSON.stringify(responseBody),
  };
}

// Handle direct Lambda invocation
async function handleDirectInvocation(event) {
  console.log("Processing direct invocation");

  const { action, data } = event;

  switch (action) {
    case "processAnalytics":
      return await processAnalyticsEvent(data);

    case "cleanupSessions":
      return await cleanupExpiredSessions();

    case "generateReport":
      return await generateAnalyticsReport(data);

    default:
      throw new Error(`Unknown action: ${action}`);
  }
}

// Create analytics event
async function createAnalyticsEvent(data) {
  const { user_id, event_type, properties = {} } = data;

  if (!user_id || !event_type) {
    throw new Error("user_id and event_type are required");
  }

  const timestamp = Date.now();
  const id = `${user_id}_${event_type}_${timestamp}`;

  const item = {
    id,
    timestamp,
    user_id,
    event_type,
    properties,
    created_at: new Date().toISOString(),
  };

  await dynamodb
    .put({
      TableName: process.env.DYNAMODB_ANALYTICS_TABLE,
      Item: item,
    })
    .promise();

  console.log("Created analytics event:", item);

  return {
    success: true,
    id,
    timestamp,
  };
}

// Get analytics data
async function getAnalyticsData(queryParams = {}) {
  const { user_id, event_type, limit = 50, start_time, end_time } = queryParams;

  let params = {
    TableName: process.env.DYNAMODB_ANALYTICS_TABLE,
    Limit: parseInt(limit),
  };

  if (user_id) {
    params.IndexName = "UserEventIndex";
    params.KeyConditionExpression = "user_id = :user_id";
    params.ExpressionAttributeValues = {
      ":user_id": user_id,
    };

    if (start_time && end_time) {
      params.KeyConditionExpression +=
        " AND #timestamp BETWEEN :start_time AND :end_time";
      params.ExpressionAttributeNames = {
        "#timestamp": "timestamp",
      };
      params.ExpressionAttributeValues[":start_time"] = parseInt(start_time);
      params.ExpressionAttributeValues[":end_time"] = parseInt(end_time);
    }
  } else if (event_type) {
    params.IndexName = "EventTypeIndex";
    params.KeyConditionExpression = "event_type = :event_type";
    params.ExpressionAttributeValues = {
      ":event_type": event_type,
    };

    if (start_time && end_time) {
      params.KeyConditionExpression +=
        " AND #timestamp BETWEEN :start_time AND :end_time";
      params.ExpressionAttributeNames = {
        "#timestamp": "timestamp",
      };
      params.ExpressionAttributeValues[":start_time"] = parseInt(start_time);
      params.ExpressionAttributeValues[":end_time"] = parseInt(end_time);
    }
  }

  const result = await dynamodb.query(params).promise();

  return {
    events: result.Items,
    count: result.Count,
    lastEvaluatedKey: result.LastEvaluatedKey,
  };
}

// Process analytics event for real-time insights
async function processAnalyticsEvent(eventData) {
  console.log("Processing analytics event:", eventData);

  // Extract event information
  const user_id = eventData.user_id?.S;
  const event_type = eventData.event_type?.S;
  const timestamp = parseInt(eventData.timestamp?.N);

  if (!user_id || !event_type) {
    console.log("Skipping event processing - missing required fields");
    return;
  }

  // Real-time analytics processing
  await Promise.all([
    updateUserMetrics(user_id, event_type, timestamp),
    updateEventMetrics(event_type, timestamp),
    checkAlertConditions(user_id, event_type, timestamp),
  ]);

  return { processed: true };
}

// Update user-specific metrics
async function updateUserMetrics(user_id, event_type, timestamp) {
  const today = new Date().toISOString().split("T")[0];
  const metricsId = `user_metrics_${user_id}_${today}`;

  try {
    await dynamodb
      .update({
        TableName: process.env.DYNAMODB_ANALYTICS_TABLE,
        Key: { id: metricsId, timestamp: 0 },
        UpdateExpression:
          "ADD #event_count :inc, #total_events :inc SET #last_activity = :timestamp",
        ExpressionAttributeNames: {
          "#event_count": `${event_type}_count`,
          "#total_events": "total_events",
          "#last_activity": "last_activity",
        },
        ExpressionAttributeValues: {
          ":inc": 1,
          ":timestamp": timestamp,
        },
      })
      .promise();

    console.log(`Updated user metrics for ${user_id}`);
  } catch (error) {
    console.error("Error updating user metrics:", error);
  }
}

// Update global event metrics
async function updateEventMetrics(event_type, timestamp) {
  const today = new Date().toISOString().split("T")[0];
  const metricsId = `event_metrics_${event_type}_${today}`;

  try {
    await dynamodb
      .update({
        TableName: process.env.DYNAMODB_ANALYTICS_TABLE,
        Key: { id: metricsId, timestamp: 0 },
        UpdateExpression: "ADD #count :inc SET #last_occurrence = :timestamp",
        ExpressionAttributeNames: {
          "#count": "count",
          "#last_occurrence": "last_occurrence",
        },
        ExpressionAttributeValues: {
          ":inc": 1,
          ":timestamp": timestamp,
        },
      })
      .promise();

    console.log(`Updated event metrics for ${event_type}`);
  } catch (error) {
    console.error("Error updating event metrics:", error);
  }
}

// Check for alert conditions
async function checkAlertConditions(user_id, event_type, timestamp) {
  // Check for suspicious activity patterns
  if (event_type === "login_failed") {
    await checkFailedLogins(user_id, timestamp);
  }

  // Check for high-frequency events
  if (["page_view", "api_call"].includes(event_type)) {
    await checkHighFrequencyEvents(user_id, event_type, timestamp);
  }
}

// Check for failed login attempts
async function checkFailedLogins(user_id, timestamp) {
  const fiveMinutesAgo = timestamp - 5 * 60 * 1000;

  const params = {
    TableName: process.env.DYNAMODB_ANALYTICS_TABLE,
    IndexName: "UserEventIndex",
    KeyConditionExpression: "user_id = :user_id AND #timestamp > :start_time",
    FilterExpression: "event_type = :event_type",
    ExpressionAttributeNames: {
      "#timestamp": "timestamp",
    },
    ExpressionAttributeValues: {
      ":user_id": user_id,
      ":start_time": fiveMinutesAgo,
      ":event_type": "login_failed",
    },
  };

  const result = await dynamodb.query(params).promise();

  if (result.Count >= 5) {
    await sendAlert(
      "security",
      `Multiple failed login attempts detected for user ${user_id}`
    );
  }
}

// Check for high-frequency events
async function checkHighFrequencyEvents(user_id, event_type, timestamp) {
  const oneMinuteAgo = timestamp - 60 * 1000;

  const params = {
    TableName: process.env.DYNAMODB_ANALYTICS_TABLE,
    IndexName: "UserEventIndex",
    KeyConditionExpression: "user_id = :user_id AND #timestamp > :start_time",
    FilterExpression: "event_type = :event_type",
    ExpressionAttributeNames: {
      "#timestamp": "timestamp",
    },
    ExpressionAttributeValues: {
      ":user_id": user_id,
      ":start_time": oneMinuteAgo,
      ":event_type": event_type,
    },
  };

  const result = await dynamodb.query(params).promise();

  if (result.Count >= 100) {
    await sendAlert(
      "performance",
      `High frequency ${event_type} events detected for user ${user_id}`
    );
  }
}

// Send alert notification
async function sendAlert(type, message) {
  try {
    await sns
      .publish({
        TopicArn: process.env.SNS_ALERTS_TOPIC,
        Subject: `Syncertica Enterprise Alert: ${type}`,
        Message: message,
      })
      .promise();

    console.log(`Alert sent: ${message}`);
  } catch (error) {
    console.error("Error sending alert:", error);
  }
}

// Cleanup expired sessions
async function cleanupExpiredSessions() {
  const now = Math.floor(Date.now() / 1000);

  const params = {
    TableName: process.env.DYNAMODB_SESSIONS_TABLE,
    FilterExpression: "expires_at < :now",
    ExpressionAttributeValues: {
      ":now": now,
    },
  };

  const result = await dynamodb.scan(params).promise();

  for (const session of result.Items) {
    await dynamodb
      .delete({
        TableName: process.env.DYNAMODB_SESSIONS_TABLE,
        Key: { id: session.id },
      })
      .promise();
  }

  console.log(`Cleaned up ${result.Items.length} expired sessions`);

  return { cleanedSessions: result.Items.length };
}

// Generate analytics report
async function generateAnalyticsReport(params = {}) {
  const { start_date, end_date, event_types = [] } = params;

  // Get event summary
  const eventSummary = await getEventSummary(start_date, end_date, event_types);

  // Get user activity
  const userActivity = await getUserActivity(start_date, end_date);

  // Get top events
  const topEvents = await getTopEvents(start_date, end_date);

  return {
    period: { start_date, end_date },
    event_summary: eventSummary,
    user_activity: userActivity,
    top_events: topEvents,
    generated_at: new Date().toISOString(),
  };
}

// Health check
async function healthCheck() {
  try {
    // Test DynamoDB connection
    await dynamodb
      .scan({
        TableName: process.env.DYNAMODB_ANALYTICS_TABLE,
        Limit: 1,
      })
      .promise();

    return {
      status: "healthy",
      timestamp: new Date().toISOString(),
      services: {
        dynamodb: "ok",
        lambda: "ok",
      },
    };
  } catch (error) {
    return {
      status: "unhealthy",
      timestamp: new Date().toISOString(),
      error: error.message,
    };
  }
}

// Helper functions for reporting
async function getEventSummary(start_date, end_date, event_types) {
  // Implementation for event summary
  return { total_events: 0, unique_users: 0, event_breakdown: {} };
}

async function getUserActivity(start_date, end_date) {
  // Implementation for user activity
  return { active_users: 0, new_users: 0, returning_users: 0 };
}

async function getTopEvents(start_date, end_date) {
  // Implementation for top events
  return [];
}
