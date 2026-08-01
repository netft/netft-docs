# Security and safety

## Network model

ATI configuration discovery uses HTTP and RDT streaming uses UDP. These protocols provide no transport encryption, peer authentication, or message integrity. A packet arriving from the configured network path is not automatically trustworthy.

Deploy sensors and acquisition hosts on a trusted, isolated or access-controlled segment. Use static assignments or DHCP reservations, firewall allowlists, and an authenticated gateway when traffic must cross a trust boundary. Do not expose device HTTP or RDT ports directly to the Internet or an untrusted shared network.

Treat discovered calibration and received samples as unauthenticated input. Verify product, active calibration, units, status, freshness, sequences, and finite values before enabling control. A manual calibration override avoids HTTP discovery but does not authenticate UDP.

## Hardware and control safety

Force/torque measurements can influence motion, force control, process limits, and protective decisions. Validate the complete sensor, network, receiver, application, controller, and safety-system installation together.

- Confirm mounting, axis directions, tool transforms, calibration, and units.
- Define maximum data age and behavior for timeout, device fault, NaN, and loss.
- Test disconnect, power loss, restart, and selected recovery policy under controlled conditions.
- Keep people clear and hazardous motion stopped before bias.
- Retain an independent emergency stop and safety-rated control path.

Net F/T software is not safety-rated and does not replace a safety PLC, emergency stop, or manufacturer-required protective system.

## Vulnerability reporting

Do not publish suspected vulnerabilities in a public issue. Use GitHub private vulnerability reporting in the repository that owns the affected runtime. Site/build vulnerabilities belong to netft-docs; CLI, Viewer, C++, Python, and ROS vulnerabilities belong to their respective repositories.

Include affected versions, sanitized reproduction, expected impact, and mitigation when available. Remove sensor addresses, credentials, recordings, personal data, and private network information.
