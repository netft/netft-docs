from pynetft import Client, Config


def main() -> None:
    with Client(Config(sensor_host="192.168.1.1")) as client:
        sample = next(client.samples(timeout=1.0))
        print(sample.force, sample.force_unit.value)
        print(sample.torque, sample.torque_unit.value)


if __name__ == "__main__":
    main()
