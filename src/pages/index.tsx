import React from 'react';
import Link from '@docusaurus/Link';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import Layout from '@theme/Layout';
import styles from './index.module.css';

const modules = [
  {
    no: '01',
    title: 'AI 概览',
    en: 'OVERVIEW',
    link: 'overview',
    desc: 'LLM、Token、上下文窗口、提示词工程、Agent 与 MCP——把常见概念一次讲透。',
    tags: ['概念', '非系列'],
  },
  {
    no: '02',
    title: 'OpenCode 系列',
    en: 'OPENCODE',
    link: 'opencode',
    desc: '从安装配置到内置 Agent、SKILL 机制与内置 API，系统性掌握 OpenCode。',
    tags: ['系列教程', '4 篇'],
  },
  {
    no: '03',
    title: 'SKILL 系列',
    en: 'SKILLS',
    link: 'skills',
    desc: '逐步积累的优秀 SKILL：文档写作、代码审查，以及可复用的编写模板。',
    tags: ['实战', '持续积累'],
  },
  {
    no: '04',
    title: 'DeepSeek Harness',
    en: 'HARNESS',
    link: 'deepseek-harness',
    desc: 'Harness 架构解析、环境搭建与工程化最佳实践。',
    tags: ['架构', '实战'],
  },
];

export default function Home(): JSX.Element {
  const { siteConfig } = useDocusaurusContext();
  return (
    <Layout title="首页" description={siteConfig.tagline}>
      <main className={styles.page}>
        {/* atmosphere: gradient mesh + grain */}
        <div className={styles.atmosphere} aria-hidden="true">
          <div className={`${styles.mesh} ${styles.meshA}`} />
          <div className={`${styles.mesh} ${styles.meshB}`} />
          <div className={styles.grain} />
        </div>

        {/* hero: asymmetric editorial layout */}
        <header className={styles.hero}>
          <div className={styles.heroInner}>
            <div className={styles.heroText}>
              <span className={`${styles.badge} ${styles.fadeUp}`} style={{ animationDelay: '0ms' }}>
                系统教程 · 持续更新
              </span>
              <h1 className={`${styles.heroTitle} ${styles.fadeUp}`} style={{ animationDelay: '80ms' }}>
                把 AI 用成
                <br />
                <em className={styles.mark}>真正的主力工具</em>
              </h1>
              <p className={`${styles.heroSub} ${styles.fadeUp}`} style={{ animationDelay: '160ms' }}>
                {siteConfig.tagline}——从概念到实战，四条主线，记录一条完整的 AI
                指导学习路径。
              </p>
              <div className={`${styles.heroButtons} ${styles.fadeUp}`} style={{ animationDelay: '240ms' }}>
                <Link to="/intro" className={`button button--primary button--lg ${styles.cta}`}>
                  开始阅读
                </Link>
                <Link to="/opencode/getting-started" className={`button button--lg ${styles.ctaGhost}`}>
                  OpenCode 快速上手 →
                </Link>
              </div>
            </div>
            <div className={`${styles.heroAside} ${styles.fadeUp}`} style={{ animationDelay: '320ms' }} aria-hidden="true">
              <div className={styles.heroAsideCard}>
                <span className={styles.heroAsideNo}>04</span>
                <span className={styles.heroAsideLabel}>条学习主线</span>
                <ul>
                  <li>概念 → 工具 → 实战</li>
                  <li>OpenCode 深度使用</li>
                  <li>SKILL 沉淀复用</li>
                  <li>Harness 工程化</li>
                </ul>
              </div>
            </div>
          </div>
        </header>

        {/* modules */}
        <section className={styles.modules}>
          <div className={styles.sectionHead}>
            <span className={styles.sectionKicker}>MODULES</span>
            <h2 className={styles.sectionTitle}>学习主线</h2>
          </div>
          <div className={styles.grid}>
            {modules.map((m, i) => (
              <Link key={m.link} to={m.link} className={styles.card} style={{ animationDelay: `${400 + i * 80}ms` }}>
                <div className={styles.cardTop}>
                  <span className={styles.cardNo}>{m.no}</span>
                  <span className={styles.cardEn}>{m.en}</span>
                </div>
                <h3 className={styles.cardTitle}>{m.title}</h3>
                <p className={styles.cardDesc}>{m.desc}</p>
                <div className={styles.cardBottom}>
                  <div className={styles.tags}>
                    {m.tags.map((t) => (
                      <span key={t} className={styles.tag}>{t}</span>
                    ))}
                  </div>
                  <span className={styles.cardCta}>阅读 →</span>
                </div>
              </Link>
            ))}
          </div>
        </section>

        <footer className={styles.pageNote}>各模块内容持续更新中 · 欢迎 GitHub 提交反馈</footer>
      </main>
    </Layout>
  );
}
