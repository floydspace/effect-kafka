# Installation

Choose your preferred package manager and run one of the following commands in your terminal:

- **Using npm:**

  ```sh
  npm install effect-kafka
  ```

- **Using pnpm:**

  ```sh
  pnpm add effect-kafka
  ```

- **Using yarn:**
  ```sh
  yarn add effect-kafka
  ```

Next install one of kafka engine packages:
- [KafkaJS](https://github.com/tulios/kafkajs?tab=readme-ov-file#-getting-started) - Fully JavaScript implementation.
- [@confluentinc/kafka-javascript](https://github.com/confluentinc/confluent-kafka-javascript?tab=readme-ov-file#requirements) - JavaScript interface for C++ librdkafka implementation, which is more performant, but requires native bindings.
- [@platformatic/kafka](https://github.com/platformatic/kafka?tab=readme-ov-file#installation) - New pure JavaScript Kafka client implementation with ambition to replace KafkaJS

_**Note:** You can use any of the above Kafka engine packages, depending on your preference._
