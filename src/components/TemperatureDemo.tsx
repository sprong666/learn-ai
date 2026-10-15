import React, { useMemo, useState } from 'react';

// 候选 Token 及其 logits（原始分数），模拟 "中国的首都是" 的续写分布
const CANDIDATES: { token: string; logit: number }[] = [
  { token: '北京', logit: 4.0 },
  { token: '中国', logit: 2.0 },
  { token: '首都', logit: 1.5 },
  { token: '一座', logit: 1.2 },
  { token: '位于', logit: 0.8 },
];

const COLORS = ['#7c4dff', '#448aff', '#26c6da', '#66bb6a', '#ffa726'];

function softmaxWithTemperature(logits: number[], temperature: number): number[] {
  const t = Math.max(temperature, 0.01);
  const scaled = logits.map(l => l / t);
  const max = Math.max(...scaled);
  const exps = scaled.map(s => Math.exp(s - max));
  const sum = exps.reduce((a, b) => a + b, 0);
  return exps.map(e => e / sum);
}

function pickFrom(probs: number[]): number {
  const r = Math.random();
  let acc = 0;
  for (let i = 0; i < probs.length; i++) {
    acc += probs[i];
    if (r < acc) return i;
  }
  return probs.length - 1;
}

// 完整回答池：每条回答带有"典型温度"，用于模拟该温度下可能出现的回答风格
const RESPONSES: { text: string; typicalTemp: number }[] = [
  { text: '中国的首都是北京。', typicalTemp: 0.1 },
  { text: '北京。', typicalTemp: 0.1 },
  { text: '中国的首都是北京，一座有着三千多年建城史的古都。', typicalTemp: 0.5 },
  { text: '中国的首都设定在北京这座城市。', typicalTemp: 0.7 },
  { text: '中国的首都是美丽的历史名城北京。', typicalTemp: 0.9 },
  { text: '啊，中国！它的首都是迷人的北京——故宫巍峨，胡同悠长，还有那一声声地道的京腔京韵。', typicalTemp: 1.2 },
  { text: '北京是中国的首都，那里有雄伟的长城脚下车水马龙，有什刹海的柳影，还有诗人们流连过的老茶馆。', typicalTemp: 1.3 },
];

// 按当前温度与各回答典型温度的接近程度计算权重，模拟该温度下的回答分布
function sampleResponses(temperature: number, count: number): string[] {
  const weights = RESPONSES.map(r => Math.exp(-Math.pow(temperature - r.typicalTemp, 2) / 0.09));
  const picked: string[] = [];
  const used = new Set<number>();
  while (picked.length < count && used.size < RESPONSES.length) {
    const total = weights.reduce((a, w, i) => (used.has(i) ? a : a + w), 0);
    let r = Math.random() * total;
    for (let i = 0; i < weights.length; i++) {
      if (used.has(i)) continue;
      r -= weights[i];
      if (r <= 0) {
        used.add(i);
        picked.push(RESPONSES[i].text);
        break;
      }
    }
  }
  return picked;
}

export default function TemperatureDemo() {
  const [temperature, setTemperature] = useState(0.7);
  const [picked, setPicked] = useState<number | null>(null);
  const [round, setRound] = useState(0);
  const [responses, setResponses] = useState<string[]>(() => sampleResponses(0.7, 3));

  const probs = useMemo(() => softmaxWithTemperature(CANDIDATES.map(c => c.logit), temperature), [temperature]);

  const style = temperature <= 0.3 ? 'Focused（专注）' : temperature <= 0.7 ? 'Balanced（平衡）' : 'Creative（发散）';

  const sample = () => {
    setPicked(pickFrom(probs));
    setRound(r => r + 1);
  };

  const refreshResponses = () => setResponses(sampleResponses(temperature, 3));

  // 滑块变化时同步刷新示例回答
  const onTemperatureChange = (value: number) => {
    setTemperature(value);
    setPicked(null);
    setResponses(sampleResponses(value, 3));
  };

  return (
    <div
      style={{
        border: '1px solid var(--ifm-color-emphasis-300)',
        borderRadius: '12px',
        padding: '1rem',
        marginBottom: '1rem',
      }}>
      <div style={{ marginBottom: '0.5rem' }}>
        <strong>输入：</strong>
        <code>中国的首都是</code>
      </div>

      <label style={{ display: 'block', marginBottom: '0.25rem' }}>
        <strong>Temperature = {temperature.toFixed(2)}</strong>
        <span style={{ marginLeft: '0.5rem', color: 'var(--ifm-color-emphasis-700)' }}>{style}</span>
      </label>
      <input
        type="range"
        min="0.01"
        max="1.5"
        step="0.01"
        value={temperature}
        onChange={e => onTemperatureChange(Number(e.target.value))}
        style={{ width: '100%' }}
      />
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: 'var(--ifm-color-emphasis-600)' }}>
        <span>0（几乎确定）</span>
        <span>1.5（高度随机）</span>
      </div>

      <div style={{ marginTop: '0.75rem' }}>
        {CANDIDATES.map((c, i) => {
          const p = probs[i];
          return (
            <div key={c.token} style={{ display: 'flex', alignItems: 'center', margin: '6px 0', gap: 8 }}>
              <code
                style={{
                  minWidth: 90,
                  fontSize: '0.85rem',
                  background: picked === i ? COLORS[i] : 'transparent',
                  color: picked === i ? '#fff' : 'inherit',
                  borderRadius: 4,
                  padding: '1px 6px',
                  border: '1px solid var(--ifm-color-emphasis-300)',
                }}>
                {c.token.trim()}
              </code>
              <div
                style={{
                  flex: 1,
                  height: 18,
                  background: 'var(--ifm-color-emphasis-200)',
                  borderRadius: 4,
                  overflow: 'hidden',
                }}>
                <div
                  style={{
                    width: `${p * 100}%`,
                    height: '100%',
                    background: COLORS[i],
                    transition: 'width 0.25s ease',
                  }}
                />
              </div>
              <span style={{ minWidth: 48, textAlign: 'right', fontSize: '0.85rem', fontVariantNumeric: 'tabular-nums' }}>
                {(p * 100).toFixed(1)}%
              </span>
            </div>
          );
        })}
      </div>

      <div style={{ marginTop: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
        <button
          className="button button--primary button--sm"
          onClick={sample}>
          按当前分布采样一次
        </button>
        {picked !== null && (
          <span>
            第 {round} 次采样选中：<strong>{CANDIDATES[picked].token.trim()}</strong>
          </span>
        )}
      </div>

      <div style={{ marginTop: '1rem', padding: '0.75rem', borderRadius: 8, background: 'var(--ifm-color-emphasis-100)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
          <strong>当前温度下的可能回答：</strong>
          <button className="button button--sm button--secondary" onClick={refreshResponses}>
            换一批
          </button>
        </div>
        <ol style={{ margin: 0, paddingLeft: '1.25rem' }}>
          {responses.map((r, i) => (
            <li key={i} style={{ margin: '4px 0', fontSize: '0.92rem' }}>
              {r}
            </li>
          ))}
        </ol>
        <div style={{ marginTop: '0.5rem', fontSize: '0.8rem', color: 'var(--ifm-color-emphasis-600)' }}>
          {temperature <= 0.3
            ? '低温：表述几乎固定，适合事实类任务'
            : temperature <= 0.7
              ? '中温：意思稳定，措辞开始有变化'
              : '高温：句式与内容越来越多样，甚至发散'}
        </div>
      </div>

      <div style={{ marginTop: '0.75rem', fontSize: '0.8rem', color: 'var(--ifm-color-emphasis-600)' }}>
        拖动滑块观察分布形状变化：低温时概率向头部 Token 集中，高温时被"抹平"、长尾 Token 也有机会被选中。
      </div>
    </div>
  );
}
