#include <chrono>
#include <iostream>

#include <netft/client.hpp>

int main() {
  netft::Config config;
  config.sensor_host = "192.168.1.1";

  netft::Client client{config};
  client.start([](const netft::Sample& sample) {
    std::cout << sample.force[0] << ' '
              << netft::to_string(sample.force_unit) << '\n';
  });

  const bool received =
      client.wait_for_first_sample(std::chrono::seconds{2});
  client.stop();
  return received ? 0 : 1;
}
