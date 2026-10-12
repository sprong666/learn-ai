import React from 'react';
import Link from '@docusaurus/Link';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';

export default function Home(): JSX.Element {
  const { siteConfig } = useDocusaurusContext();
  return (
    <main style={{ textAlign: 'center', padding: '4rem 1rem' }}>
      <h1 style={{ fontSize: '3rem', marginBottom: '1rem' }}>{siteConfig.title}</h1>
      <p style={{ fontSize: '1.3rem', color: '#666', marginBottom: '2rem' }}>{siteConfig.tagline}</p>
      <Link to="/intro" className="button button--primary button--lg">开始阅读</Link>
    </main>
  );
}
