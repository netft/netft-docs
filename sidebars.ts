import type {SidebarsConfig} from '@docusaurus/plugin-content-docs';

const sidebars: SidebarsConfig = {
  docs: [
    {
      type: 'category',
      label: 'Get started',
      collapsed: false,
      items: [
        'get-started/introduction',
        'get-started/installation',
        'get-started/quick-start',
      ],
    },
    {
      type: 'category',
      label: 'Tutorials',
      collapsed: false,
      items: [
        {
          type: 'category',
          label: 'Fundamentals',
          items: [
            'tutorials/fundamentals/sensor-measurements',
            'tutorials/fundamentals/networking-and-rdt',
            'tutorials/fundamentals/reliable-acquisition',
            'tutorials/fundamentals/units-frames-and-bias',
          ],
        },
        {
          type: 'category',
          label: 'CLI',
          items: [
            'tutorials/cli/inspect-and-validate',
            'tutorials/cli/monitor-live-data',
            'tutorials/cli/record-a-capture',
            'tutorials/cli/automate-health-checks',
          ],
        },
        {
          type: 'category',
          label: 'Viewer',
          items: [
            'tutorials/viewer/connect-and-inspect',
            'tutorials/viewer/record-and-review',
          ],
        },
        {
          type: 'category',
          label: 'ROS',
          items: ['tutorials/ros/standalone', 'tutorials/ros/ros2-control'],
        },
        {
          type: 'category',
          label: 'SDKs',
          items: ['tutorials/sdks/cpp', 'tutorials/sdks/python'],
        },
        'tutorials/troubleshooting/index',
      ],
    },
    {
      type: 'category',
      label: 'References',
      collapsed: false,
      items: [
        {
          type: 'category',
          label: 'C++ API',
          items: [
            'references/cpp-api/overview',
            'references/cpp-api/client',
            'references/cpp-api/configuration',
            'references/cpp-api/sample-and-health',
            'references/cpp-api/enumerations',
            'references/cpp-api/functions',
            'references/cpp-api/errors',
          ],
        },
        {
          type: 'category',
          label: 'Python API',
          items: [
            'references/python-api/overview',
            'references/python-api/client',
            'references/python-api/configuration',
            'references/python-api/sample-and-health',
            'references/python-api/enumerations',
            'references/python-api/exceptions',
          ],
        },
        {
          type: 'category',
          label: 'CLI commands',
          items: [
            'references/cli/overview',
            'references/cli/info',
            'references/cli/check',
            'references/cli/monitor',
            'references/cli/record',
            'references/cli/bias',
            'references/cli/completion',
          ],
        },
        {
          type: 'category',
          label: 'ROS interfaces',
          items: [
            'references/ros/standalone',
            'references/ros/ros2-control',
            'references/ros/diagnostics-and-lifecycle',
          ],
        },
        {
          type: 'category',
          label: 'Data formats',
          items: [
            'references/data-formats/native-sample',
            'references/data-formats/json-and-ndjson',
            'references/data-formats/csv',
            'references/data-formats/units-status-and-faults',
          ],
        },
        'references/compatibility',
        'references/security-and-safety',
        'references/about',
      ],
    },
  ],
};

export default sidebars;
