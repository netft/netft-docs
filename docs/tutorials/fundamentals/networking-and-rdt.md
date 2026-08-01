# Networking and RDT

Net F/T software uses two device interfaces. It reads configuration over HTTP, normally from `http://<sensor-ip>:80/netftapi2.xml`, and receives measurements through ATI's RDT protocol over UDP, normally on port 49152. Neither protocol supplies encryption, peer authentication, or message integrity.

![A client reaches the NetBox over a trusted Ethernet network; HTTP carries configuration and RDT over UDP returns samples.](/img/network-topology.svg)

## Addressing

ATI documents `192.168.1.1` as the factory-default static address for the Net F/T systems covered here. DHCP-enabled devices use a network-assigned address when available and fall back to static settings when DHCP is unavailable. Production installations should use a documented static assignment or DHCP reservation so the endpoint does not change unexpectedly.

For direct commissioning, place the host in the same IPv4 subnet with a different address. Preserve the host's original settings before changing them. In a permanent network, document the sensor MAC, address, subnet, gateway, active calibration, and owner.

A successful browser or curl request confirms the HTTP path only. RDT replies can still fail because of the UDP port, firewall, return route, VPN, or another client.

## RDT streaming

The client sends a command and requested sample count. The sensor returns records containing an RDT sequence, force/torque sequence, status, and six counts. Continuous acquisition requests high-speed streaming until stopped or redirected.

UDP does not guarantee delivery, ordering, or uniqueness. The shared core rejects duplicates and out-of-order records, records gaps, and exposes sequence and rate health. It also detects stalled or implausibly backward measurement sequences rather than delivering them as new samples.

The two sequences answer different questions:

| Field        | Use                                                                               |
| ------------ | --------------------------------------------------------------------------------- |
| RDT sequence | Detect missing, duplicate, or reordered UDP records in the current request stream |
| F/T sequence | Confirm that the device measurement counter continues to advance                  |

Sequence counters wrap. Consumers should use the SDK health results instead of subtracting unsigned fields naively. A device restart can reset the F/T counter; that event is reported separately from ordinary UDP loss.

## One stream owner

Normal RDT operation responds to one client. A second start request can redirect the stream, so the first client begins timing out even though its network did not change. Before switching interfaces, stop the ATI demo, CLI monitor, Viewer, SDK process, or ROS driver that currently owns streaming.

When several consumers need the same data, use one acquisition owner and distribute samples through ROS topics, IPC, or an application service. Do not run several clients that repeatedly compete for the sensor.

## Firewall and network design

Keep the device and acquisition host on a trusted, access-controlled segment. Permit client-to-sensor HTTP and RDT requests plus the UDP return path. Do not expose the NetBox directly to the Internet or an untrusted wireless network.

Prefer wired Ethernet. Wi-Fi bridges, VPNs, congested switches, power-saving NIC settings, and ambiguous routes can increase jitter or packet loss. Validate the complete production path under representative CPU, storage, controller, and network load.

On normal shutdown, Net F/T clients send Stop Streaming and close their sockets. Use normal shutdown so the sensor does not continue targeting an abandoned endpoint.

## Isolate a failed boundary

Test configuration and streaming independently:

```bash
netft info SENSOR --format json
netft check SENSOR --duration 5s --format json
```

If `info` fails, investigate addressing, routing, power, HTTP, or configuration content. If `info` passes but `check` cannot receive a first sample, investigate stream ownership, the RDT port, firewall, and UDP return route. If both pass but another application fails, the device path is established and the fault is more likely in that application's configuration or consumption logic.
