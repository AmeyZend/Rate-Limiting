
# User Task Queuing with Rate Limiting

## **Overview**
This project implements a Node.js API with a task queuing and rate-limiting system. It ensures that tasks submitted by users adhere to the following rate limits:
- **1 task per second** per user.
- **20 tasks per minute** per user.

Tasks exceeding these limits are queued and processed later without dropping any requests. The system uses a Redis-backed queue for reliability and scalability.

---

## **Features**
1. **Rate Limiting**: Enforces per-second and per-minute task submission limits for each user.
2. **Task Queuing**: Tasks exceeding the rate limit are queued and executed later.
3. **Cluster Mode**: Utilizes Node.js cluster to leverage multiple CPU cores for better scalability.
4. **Logging**: Logs task completion events with timestamps to a log file (`task_logs.log`).
5. **Resilience**: Redis ensures task persistence even during system failures.

---

## **Prerequisites**
- **Node.js** (v14 or higher)
- **Redis** (latest stable version)
- **npm** (v7 or higher)

---

## **Setup Instructions**

### **Step 1: Install Dependencies**
Run the following command to install the required packages:
```bash
npm install express body-parser redis bull winston cluster os
```

### **Step 2: Start Redis**
Ensure that Redis is running on your system. Start Redis with:
```bash
redis-server
```

### **Step 3: Run the Server**
Start the server by running:
```bash
node app.js
```

If using a multi-core system, the application will spawn two worker processes using Node.js's **cluster** module.

---

## **Usage**
### **API Route**
- **Endpoint**: `/api/v1/task`
- **Method**: `POST`
- **Body**: JSON
  ```json
  {
    "user_id": "123"
  }
  ```

### **Example Request**
Use CURL or Postman to send a POST request:
```bash
curl -X POST http://localhost:3000/api/v1/task \
-H "Content-Type: application/json" \
-d '{"user_id":"123"}'
```

### **Response**
- **200 OK**: Task added to the queue within the allowed rate limit.
  ```json
  {
    "status": "Task added to queue"
  }
  ```
- **429 Too Many Requests**: Rate limit exceeded. Task queued for later execution.
  ```json
  {
    "status": "Rate limit exceeded. Task queued with delay"
  }
  ```

---

## **Log File**
All task completion events are logged in a file named `task_logs.log` in the root directory. Each log entry includes:
- **User ID**
- **Timestamp**

---

## **Project Structure**
```
.
├── app.js          # Main server file
├── package.json    # Node.js project dependencies
├── task_logs.log   # Log file for task completion
├── README.md       # Documentation
```

---

## **Testing**
### **Rate Limiting Test**
1. Send multiple requests within a second for the same user ID. Observe that tasks beyond the first request are delayed.
2. Verify that a user cannot exceed 20 tasks in one minute.

### **Queueing Test**
1. Exceed the rate limit and verify that all tasks are queued and eventually executed.
2. Check `task_logs.log` for task execution timestamps.

---

## **Scalability**
- **Cluster Mode**: Spawns multiple workers based on CPU cores for better concurrency.
- **Redis Queue**: Centralized task storage ensures distributed workers can process tasks efficiently.

---

## **Assumptions**
- Each `user_id` is unique and required in requests.
- Redis is accessible at `localhost:6379`.

---

## **Improvements**
- Extend rate-limiting logic to a database-backed store for distributed systems.
- Add a monitoring dashboard for queued and processed tasks.

---

## **Contact**
For questions or feedback, feel free to contact [AMEY DEEPAK ZEND](mailto:amayzend@gmail.com).
