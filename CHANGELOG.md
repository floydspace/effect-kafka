# effect-kafka

## 0.7.1

### Patch Changes

- [#34](https://github.com/floydspace/effect-kafka/pull/34) [`936a300`](https://github.com/floydspace/effect-kafka/commit/936a300b861f35bcf1eb7cbd034bd5b7ef8a60d6) Thanks [@floydspace](https://github.com/floydspace)! - fix hanging stream when handler fails

  closes [#33](https://github.com/floydspace/effect-kafka/issues/33)

## 0.7.0

### Minor Changes

- [#30](https://github.com/floydspace/effect-kafka/pull/30) [`7d101fb`](https://github.com/floydspace/effect-kafka/commit/7d101fbc69681de5e335c209733ebf8c7b66e8cc) Thanks [@Almaju](https://github.com/Almaju)! - add admin api

## 0.6.0

### Minor Changes

- [#29](https://github.com/floydspace/effect-kafka/pull/29) [`d3c8fc0`](https://github.com/floydspace/effect-kafka/commit/d3c8fc07e5acba32f7b40ccd74bd96c1179b8717) Thanks [@floydspace](https://github.com/floydspace)! - define UnknownProducerError and use it as fallback for all errors happend in producer engine

### Patch Changes

- [#29](https://github.com/floydspace/effect-kafka/pull/29) [`d3c8fc0`](https://github.com/floydspace/effect-kafka/commit/d3c8fc07e5acba32f7b40ccd74bd96c1179b8717) Thanks [@floydspace](https://github.com/floydspace)! - Poll and retry in case QueueFull error raised

- [#20](https://github.com/floydspace/effect-kafka/pull/20) [`4c5f113`](https://github.com/floydspace/effect-kafka/commit/4c5f1130eae68c431d22e6d76e510164b2809909) Thanks [@floydspace](https://github.com/floydspace)! - implement an ability to catch errors raised in MessageRouter handler

## 0.5.2

### Patch Changes

- [#25](https://github.com/floydspace/effect-kafka/pull/25) [`21df29a`](https://github.com/floydspace/effect-kafka/commit/21df29a96e301f3eae740b3b3c8a0cc6a8af5a82) Thanks [@floydspace](https://github.com/floydspace)! - fix esm distro

## 0.5.1

### Patch Changes

- [`d9a8d4d`](https://github.com/floydspace/effect-kafka/commit/d9a8d4d78bb87d6df0c14c8df26bac7ddaf75e22) Thanks [@floydspace](https://github.com/floydspace)! - fix bug in internal types

## 0.5.0

### Minor Changes

- [#22](https://github.com/floydspace/effect-kafka/pull/22) [`42f2df9`](https://github.com/floydspace/effect-kafka/commit/42f2df9a7338ec1e9f90a429eb9a4349e8a77dd5) Thanks [@floydspace](https://github.com/floydspace)! - Improve build configuration, expose sub packages and fix optional peer dependencies bug, closes #21

## 0.4.3

### Patch Changes

- [#18](https://github.com/floydspace/effect-kafka/pull/18) [`64bbd83`](https://github.com/floydspace/effect-kafka/commit/64bbd831db69692e5ed765340766cef6b01f518b) Thanks [@floydspace](https://github.com/floydspace)! - proxy more config options for rdkafka

- [`7bd1b0c`](https://github.com/floydspace/effect-kafka/commit/7bd1b0ce1e6b018a0bfe7e5afda0dc42b9b8ef50) Thanks [@floydspace](https://github.com/floydspace)! - implement in memory kafka instance, closes #9

## 0.4.2

### Patch Changes

- [`0ef48b3`](https://github.com/floydspace/effect-kafka/commit/0ef48b3e299e340b266d2bc4961c3c4bc232c2dd) Thanks [@floydspace](https://github.com/floydspace)! - forward rdkafka logs, use `Logger.withMinimumLogLevel` to enable desired log levels, closes #11

## 0.4.1

### Patch Changes

- [`b72be89`](https://github.com/floydspace/effect-kafka/commit/b72be89bcb82b83614afcae7743eb4bbbb5b674b) Thanks [@floydspace](https://github.com/floydspace)! - fix bug when message offered to the queue was not suspended in case of back pressure

- [`b72be89`](https://github.com/floydspace/effect-kafka/commit/b72be89bcb82b83614afcae7743eb4bbbb5b674b) Thanks [@floydspace](https://github.com/floydspace)! - add layerConfig for kafka instance implementations

## 0.4.0

### Minor Changes

- [`4783992`](https://github.com/floydspace/effect-kafka/commit/4783992fdbea657d6ab061604979c733a8845d74) Thanks [@floydspace](https://github.com/floydspace)! - rename producer `send` as `sendScoped`, and define different `send` signature

### Patch Changes

- [`af964dd`](https://github.com/floydspace/effect-kafka/commit/af964dd81a6eb1c6766145d497d2990834f78481) Thanks [@floydspace](https://github.com/floydspace)! - allow wider range of kafka engines versions

## 0.3.2

### Patch Changes

- [`dd8dea2`](https://github.com/floydspace/effect-kafka/commit/dd8dea249469c480bfbbd3c58e6b73000933802b) Thanks [@floydspace](https://github.com/floydspace)! - remove unnecessary peer to @effect/platform

- [`16610c1`](https://github.com/floydspace/effect-kafka/commit/16610c11b61241917dea9042b99c818b556dbed0) Thanks [@floydspace](https://github.com/floydspace)! - run consumer scoped

## 0.3.1

### Patch Changes

- [`5f5b329`](https://github.com/floydspace/effect-kafka/commit/5f5b329b91c801e826c60d549816ba0769573d47) Thanks [@floydspace](https://github.com/floydspace)! - fix consumer layers usage

## 0.3.0

### Minor Changes

- [`c2902e0`](https://github.com/floydspace/effect-kafka/commit/c2902e0ba0723331346169454f45b3541c8d6276) Thanks [@floydspace](https://github.com/floydspace)! - - rename `MessagePayload` to `ConsumerRecord` similar how it is named in `zio-kafka`

  - handle message batches manually

- [#4](https://github.com/floydspace/effect-kafka/pull/4) [`f5d97d2`](https://github.com/floydspace/effect-kafka/commit/f5d97d2a843ca450ffef6d679b213c8addf70459) Thanks [@floydspace](https://github.com/floydspace)! - implement stream consumer
  allow handling commits manually

## 0.2.0

### Minor Changes

- [`ce326b9`](https://github.com/floydspace/effect-kafka/commit/ce326b97b94f44fdb4c8d2ba1d906ab601b2f914) Thanks [@floydspace](https://github.com/floydspace)! - implement more clean layer configuration, add confluent kafka examples

- [`801815b`](https://github.com/floydspace/effect-kafka/commit/801815be2798145faf3c63c06260d448b0994893) Thanks [@floydspace](https://github.com/floydspace)! - improve connection error handling

- [`58a3803`](https://github.com/floydspace/effect-kafka/commit/58a3803cd6e2e449e5f31d7285868fbbb94a5b7c) Thanks [@floydspace](https://github.com/floydspace)! - implement producer

## 0.1.0

### Minor Changes

- [`ea84542`](https://github.com/floydspace/effect-kafka/commit/ea84542b10f7a2b518e21361887c146a7e3cf3e2) Thanks [@floydspace](https://github.com/floydspace)! - release first prototype
