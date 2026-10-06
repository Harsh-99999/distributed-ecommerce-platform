# Distributed E-Commerce Platform

A microservices-based e-commerce platform built with **Java, Spring Boot, Spring Cloud, React, PostgreSQL, Kafka, RabbitMQ, Redis, and Docker**.

The project demonstrates how a modern e-commerce system can be divided into independent services while handling authentication, inventory, orders, payments, seller operations, asynchronous events, caching, and observability.

## Features

- Microservices architecture with Spring Boot and Spring Cloud
- API Gateway for routing and request handling
- Service discovery with Eureka
- Centralized configuration with Spring Cloud Config
- JWT-based authentication and role-based authorization
- Product catalog and inventory management
- Redis-backed shopping cart
- Order processing with Saga-style workflow
- Payment service with mock payment processing
- Kafka and RabbitMQ for asynchronous communication
- Transactional outbox pattern for reliable event publishing
- Idempotent order/event processing
- Multi-seller marketplace with listings and seller-specific orders
- Seller commissions, payouts, reviews, and return requests
- Product recommendations through a dedicated recommendation service
- Server-Sent Events for catalog streaming
- Prometheus, Grafana, and Zipkin for monitoring and distributed tracing
- React + Vite frontend served through Nginx
- Docker Compose setup for running the complete system

---

## Architecture

```text
                         ┌─────────────────────┐
                         │    React Frontend    │
                         │      + Nginx         │
                         └──────────┬──────────┘
                                    │
                                    ▼
                         ┌─────────────────────┐
                         │     API Gateway      │
                         │   Spring Cloud       │
                         └──────────┬──────────┘
                                    │
              ┌─────────────────────┼─────────────────────┐
              │                     │                     │
              ▼                     ▼                     ▼
       ┌────────────┐       ┌────────────┐       ┌────────────┐
       │User Service│       │  Product   │       │Cart Service│
       │    JWT     │       │  Service   │       │   Redis    │
       └────────────┘       └─────┬──────┘       └────────────┘
                                  │
                                  ▼
                           ┌──────────────┐
                           │   Inventory  │
                           │    Service   │
                           └──────────────┘

       ┌────────────┐       ┌────────────┐       ┌──────────────┐
       │   Order    │──────▶│  Payment   │       │    Seller    │
       │   Service  │       │  Service   │       │   Service    │
       └─────┬──────┘       └────────────┘       └──────────────┘
             │
             │ Outbox Events
             ▼
       ┌────────────┐
       │   Kafka    │──────────────▶ Notification Service
       └────────────┘
             │
             └──────────────▶ Other event consumers

       ┌──────────────────────────────────────────────────────┐
       │ Recommendation │ Catalog Stream │ Config │ Discovery │
       └──────────────────────────────────────────────────────┘

       ┌────────────┐  ┌────────────┐  ┌────────────┐
       │ PostgreSQL │  │   Redis    │  │ RabbitMQ   │
       └────────────┘  └────────────┘  └────────────┘

       ┌────────────┐  ┌────────────┐  ┌────────────┐
       │ Prometheus │  │  Grafana   │  │   Zipkin   │
       └────────────┘  └────────────┘  └────────────┘
```

## Services

| Service | Port | Responsibility |
|---|---:|---|
| Config Server | 8888 | Centralized configuration |
| Discovery Server | 8761 | Eureka service registry |
| API Gateway | 8080 | Routing and gateway-level security |
| User Service | 8081 | Authentication and user management |
| Product Service | 8082 | Product catalog |
| Cart Service | 8083 | Shopping cart and Redis integration |
| Inventory Service | 8084 | Stock and reservations |
| Payment Service | 8085 | Payment processing |
| Order Service | 8086 | Orders, saga workflow, payouts and returns |
| Notification Service | 8087 | Event-driven notifications |
| Recommendation Service | 8088 | Product recommendations |
| Catalog Stream Service | 8089 | Reactive catalog streaming |
| Seller Service | 8090 | Sellers, listings, reviews and marketplace operations |

---

## Order Processing

Orders are handled through a multi-step workflow coordinated by the order service.

```text
Client
  │
  ▼
Order Service
  │
  ├── Fetch cart
  ├── Validate coupon
  ├── Create PENDING order
  ├── Reserve inventory
  ├── Process payment
  ├── Commit inventory reservation
  ├── Create seller sub-orders
  ├── Mark order CONFIRMED
  └── Create outbox event
              │
              ▼
        Kafka / RabbitMQ
              │
              ▼
      Notification Service
```

If a later step fails, the workflow performs the required compensating actions, such as releasing inventory or refunding a payment.

## Transactional Outbox

The order service uses an **outbox pattern** to reduce the risk of losing events between a database transaction and message publication.

When an order is confirmed:

1. The order state is updated.
2. An outbox event is stored in the same database transaction.
3. A scheduled relay publishes pending events to Kafka.
4. Consumers process the event with idempotency handling.

This separates the database transaction from message delivery while keeping the event durable.

---

## Authentication

The application uses JWT-based authentication.

```text
Login
  │
  ▼
User Service
  │
  ├── Verify BCrypt password
  └── Return access + refresh tokens
              │
              ▼
        API Gateway
              │
              ├── Validate JWT
              ├── Extract user ID / role
              └── Forward authenticated request
                       │
                       ▼
                 Backend Service
```

Authenticated requests use:

```text
Authorization: Bearer <access-token>
```

The frontend also supports refresh-token handling when an access token expires.

---

## Marketplace

The platform supports multiple sellers offering products through individual listings.

### Seller capabilities

- Seller application and approval
- Seller profiles
- Product listings
- Seller-specific pricing
- Seller-specific orders
- Commission calculation
- Reviews and ratings
- Payout management
- Return requests

A product can have multiple seller listings, allowing the platform to select an appropriate listing based on factors such as price and shipping time.

---

## Caching

Redis is used for the shopping cart and related distributed data.

The product service also uses application-level caching for frequently requested catalog information.

Cache invalidation is performed when relevant product data changes.

---

## Messaging

The project uses two messaging systems for asynchronous communication:

### Kafka

Used for durable event-driven communication such as:

```text
Order Service
     │
     ▼
order.confirmed
     │
     ▼
Notification Service
```

### RabbitMQ

Used for message-based communication where low-latency delivery is useful.

The notification service contains idempotency handling so duplicate messages do not result in duplicate processing.

---

## Recommendation Service

The recommendation service provides product recommendation functionality through a dedicated service.

It supports operations such as:

- Product search
- Similar-product lookup
- User-oriented recommendations

The service also exposes an MCP/SSE interface for recommendation-related tools.

---

## Reactive Catalog Streaming

The catalog stream service uses:

- Spring WebFlux
- R2DBC
- Server-Sent Events (SSE)

This provides a reactive endpoint for streaming catalog-related updates to connected clients.

---

## Observability

The system includes a monitoring and tracing stack:

| Tool | Purpose |
|---|---|
| Prometheus | Metrics collection |
| Grafana | Metrics dashboards |
| Zipkin | Distributed tracing |
| Spring Actuator | Health and application metrics |
| Micrometer | Application metrics |

Example flow:

```text
Browser
   │
   ▼
API Gateway
   │
   ▼
Order Service
   │
   ├── Inventory Service
   └── Payment Service
```

Distributed tracing can be used to follow a request across these services.

---

## Frontend

The frontend is included directly in this repository under:

```text
frontend-app/
```

### Stack

- React 18
- Vite
- React Router
- JavaScript
- CSS
- Nginx

The frontend communicates with the backend through the API Gateway.

The frontend Docker image is built locally as part of the Compose setup rather than being pulled from a separate frontend repository.

---

## Running the Project

### Requirements

- Docker
- Docker Compose
- Git

For local development outside Docker, Java 21 and Maven are also useful.

### Start the complete application

```bash
docker compose up --build
```

After the containers start:

| Component | URL |
|---|---|
| Frontend | http://localhost |
| API Gateway | http://localhost:8080 |
| Eureka | http://localhost:8761 |
| Prometheus | http://localhost:9090 |
| Grafana | http://localhost:3000 |
| Zipkin | http://localhost:9411 |
| RabbitMQ | http://localhost:15672 |

---

## Project Structure

```text
springboot-ecommerce/
│
├── frontend-app/
│   ├── src/
│   ├── public/
│   ├── Dockerfile
│   └── package.json
│
├── infrastructure/
│   ├── api-gateway/
│   ├── config-server/
│   └── discovery-server/
│
├── services/
│   ├── user-service/
│   ├── product-service/
│   ├── cart-service/
│   ├── inventory-service/
│   ├── payment-service/
│   ├── order-service/
│   ├── notification-service/
│   ├── recommendation-service/
│   ├── catalog-stream-service/
│   └── seller-service/
│
├── shared/
│   └── common/
│
├── scripts/
│   ├── smoke-test.sh
│   └── seed/
│
├── docker/
├── docker-compose.yml
├── docker-compose.prod.yml
├── Dockerfile
└── pom.xml
```

---

## Testing

Run the complete Maven test suite with:

```bash
./mvnw test
```

Run verification:

```bash
./mvnw verify
```

Run tests for an individual service:

```bash
./mvnw -pl services/order-service test
```

An end-to-end smoke test is also available:

```bash
./scripts/smoke-test.sh
```

---

## Demo Data

The repository includes scripts for generating demonstration data such as:

- Users
- Sellers
- Products
- Listings
- Reviews
- Inventory
- Orders

Seed scripts are located under:

```text
scripts/seed/
```

---

## Technology Stack

**Backend**

- Java 21
- Spring Boot
- Spring Cloud
- Spring Security
- Spring Data JPA
- Spring WebFlux
- R2DBC

**Frontend**

- React
- Vite
- React Router
- JavaScript
- CSS
- Nginx

**Databases & Storage**

- PostgreSQL
- Redis

**Messaging**

- Apache Kafka
- RabbitMQ

**Infrastructure**

- Docker
- Docker Compose
- Eureka
- Spring Cloud Config
- Spring Cloud Gateway

**Observability**

- Prometheus
- Grafana
- Zipkin
- Micrometer
- Spring Actuator

---

## License

This repository is intended for educational and portfolio use.
