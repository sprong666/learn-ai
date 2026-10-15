import React, { useCallback, useEffect, useRef, useState } from 'react';
import useBaseUrl from '@docusaurus/useBaseUrl';

type ModelKey = 'deepseek' | 'qwen2' | 'gpt2' | 'llama';

const MODELS: Record<ModelKey, { name: string; label: string }> = {
  deepseek: { name: 'deepseek-ai/deepseek-coder-1.3b-base', label: 'DeepSeek' },
  qwen2: { name: 'Qwen/Qwen2-0.5B', label: 'Qwen2' },
  gpt2: { name: 'gpt2', label: 'GPT-2' },
  llama: { name: 'huggyllama/llama-7b', label: 'Llama' },
};

const SAMPLE_TEXT = '人工智能改变世界。The quick brown fox jumps over the lazy dog.';

function tokenColor(index: number): string {
  return `hsl(${(index * 47) % 360} 70% 82%)`;
}

function displayToken(token: string): string {
  return token
    .replace(/Ġ/g, '·')
    .replace(/▁/g, '·')
    .replace(/\n/g, '\\n')
    .replace(/\s/g, '·');
}

export default function TokenizerDemo() {
  const modelLibRef = useRef<any>(null);
  const tokenizerRef = useRef<any>(null);
  const libUrl = useBaseUrl('/tokenizer/transformers.min.js');
  const modelsUrl = useBaseUrl('/tokenizer/models/') + '/';
  const [model, setModel] = useState<ModelKey>('deepseek');
  const [text, setText] = useState(SAMPLE_TEXT);
  const [status, setStatus] = useState<'idle' | 'loading' | 'ready' | 'error'>('idle');
  const [libReady, setLibReady] = useState(false);
  const [error, setError] = useState<string>('');
  const [tokens, setTokens] = useState<{ id: number; raw: string }[]>([]);

  useEffect(() => {
    // 运行时加载静态目录下的 transformers.js 浏览器构建，不参与站点打包
    import(
      /* webpackIgnore: true */ libUrl
    )
      .then((lib: any) => {
        // 词表已本地化到 static/tokenizer/models/，同源加载，无跨域、不依赖外网。
        // useBrowserCache=false：避免早期失败时缓存投毒（缓存了 404 HTML 导致 JSON 解析失败）
        if (lib.env) {
          lib.env.allowLocalModels = true;
          lib.env.allowRemoteModels = false;
          lib.env.localModelPath = modelsUrl;
          lib.env.useBrowserCache = false;
        }
        modelLibRef.current = lib;
        setLibReady(true);
      })
      .catch(e => {
        setStatus('error');
        setError(`加载 transformers.js 失败：${e.message}`);
      });
  }, [libUrl]);

  const tokenize = useCallback(
    async (modelKey: ModelKey, input: string) => {
      const lib = modelLibRef.current;
      if (!lib) return;
      const config = MODELS[modelKey];
      setStatus('loading');
      setError('');
      try {
        tokenizerRef.current = await lib.AutoTokenizer.from_pretrained(config.name);
        const encoded: number[] = tokenizerRef.current.encode(input);
        setTokens(
          encoded.map(id => ({
            id,
            raw: tokenizerRef.current.decode([id], { skip_special_tokens: false }),
          })),
        );
        setStatus('ready');
      } catch (e: any) {
        setStatus('error');
        setError(`加载 ${config.label} 分词器失败：${e.message}`);
        setTokens([]);
      }
    },
    [],
  );

  useEffect(() => {
    if (libReady) {
      tokenize(model, text);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [libReady, model, tokenize]);

  const onTextChange = (value: string) => {
    setText(value);
    if (modelLibRef.current && tokenizerRef.current) {
      // 已有分词器时仅重新编码，避免重复加载
      try {
        const encoded: number[] = tokenizerRef.current.encode(value);
        setTokens(
          encoded.map(id => ({
            id,
            raw: tokenizerRef.current.decode([id], { skip_special_tokens: false }),
          })),
        );
      } catch {
        /* ignore transient empty input errors */
      }
    }
  };

  return (
    <div
      style={{
        border: '1px solid var(--ifm-color-emphasis-300)',
        borderRadius: '12px',
        padding: '1rem',
        marginBottom: '1rem',
      }}>
      <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap', marginBottom: '0.75rem' }}>
        <strong>模型分词器：</strong>
        {(Object.keys(MODELS) as ModelKey[]).map(key => (
          <label key={key} style={{ cursor: 'pointer', fontWeight: model === key ? 700 : 400 }}>
            <input
              type="radio"
              name="tokenizer-model"
              checked={model === key}
              onChange={() => setModel(key)}
              style={{ marginRight: 4 }}
            />
            {MODELS[key].label}
          </label>
        ))}
      </div>

      <textarea
        value={text}
        onChange={e => onTextChange(e.target.value)}
        rows={3}
        placeholder="输入要分词的文本……"
        style={{
          width: '100%',
          padding: '0.6rem',
          borderRadius: '8px',
          border: '1px solid var(--ifm-color-emphasis-400)',
          fontFamily: 'inherit',
          fontSize: '0.95rem',
          resize: 'vertical',
        }}
      />

      <div style={{ marginTop: '0.75rem', fontSize: '0.9rem' }}>
        {status === 'loading' && <span>⏳ 首次加载分词器需要从 Hugging Face 下载词表，请稍候……</span>}
        {status === 'ready' && (
          <>
            <div style={{ marginBottom: '0.5rem', color: 'var(--ifm-color-emphasis-700)' }}>
              共 <strong>{tokens.length}</strong> 个 Token（悬停查看 ID）
            </div>
            <div style={{ lineHeight: 2 }}>
              {tokens.map((t, i) => (
                <span
                  key={i}
                  title={`Token ${i + 1} · ID: ${t.id} · 原始: "${t.raw}"`}
                  style={{
                    display: 'inline-block',
                    margin: 2,
                    padding: '2px 8px',
                    borderRadius: 6,
                    border: '1px solid rgba(0,0,0,0.12)',
                    backgroundColor: tokenColor(i),
                    fontFamily: 'var(--ifm-font-family-monospace)',
                    fontSize: '0.85rem',
                  }}>
                  {displayToken(t.raw)}
                </span>
              ))}
            </div>
          </>
        )}
        {status === 'error' && (
          <span style={{ color: '#e74c3c' }}>✗ {error}</span>
        )}
        {status === 'idle' && <span>正在初始化……</span>}
      </div>

      <div style={{ marginTop: '0.75rem', fontSize: '0.8rem', color: 'var(--ifm-color-emphasis-600)' }}>
        基于 Hugging Face transformers.js，全部计算在你的浏览器本地完成，文本不会上传。
      </div>
    </div>
  );
}
