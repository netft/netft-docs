import Link from '@docusaurus/Link';
import useBaseUrl from '@docusaurus/useBaseUrl';
import Layout from '@theme/Layout';
import type {ReactNode} from 'react';
import styles from './index.module.css';

export default function Home(): ReactNode {
  const heroImage = useBaseUrl('/img/netft-viewer.png');

  return (
    <Layout
      title="Open-source force and torque sensor tools"
      description="Connect, inspect, visualize, and integrate ATI Net F/T sensors with C++, Python, ROS, command-line, and desktop tools."
    >
      <main className={styles.home}>
        <section className={styles.hero}>
          <div className={styles.heroContent}>
            <img
              src={heroImage}
              alt="Net F/T Viewer displaying live six-axis data"
            />
            <h1>Connect force and torque to your work.</h1>
            <Link
              className={styles.primaryAction}
              to="/docs/get-started/introduction"
            >
              Get started
            </Link>
          </div>
        </section>
      </main>
    </Layout>
  );
}
