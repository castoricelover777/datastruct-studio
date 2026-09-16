'use strict';
/**
 * 07-01 KMP 字符串匹配 —— 动画场景
 *
 * 六个模块各一段，和 modules.c 的模块编号一一对应：
 *
 *   01 typedef      约定：下标从 0 开始，match[j] 是什么
 *   02 NaiveMatch   暴力匹配：为什么最坏是 O(n·m)（每一格都比一遍）
 *   03 match        最长相等前后缀：定义 + 逐位硬算
 *   04 buildMatch   递推：用上一位的结果推下一位，O(m) 建表
 *   05 KMPMatch     主线：失配时只滑模式串，主串指针永不后退
 *   06 main         对照：同一组输入两个算法结果必须一致
 *
 * 格子阵列渲染器的每格只有 58px，塞不下 "abab" 这种多字符串，
 * 所以这里的约定是：
 *   · 格子里只放**单字符或一位数字**
 *   · 模式串/主串本身写在字幕（steps）和标注（notes）里
 *
 * 写场景的硬规矩（见交接文档第三节 5、6）：
 *   · 文案说"交换/变成/结果"时，格子的变形必须在**同一时刻**发生
 *   · 初始那批格子写了 [[0, x]] 这种"到点就没"的区间，后续每次变形都要把
 *     没动的那几格一起续上，否则它们会凭空消失
 *   · 别让画面出现超过 1.2 秒的空屏
 */

const GREEN = '#10B981';
const RED = '#EF4444';
const AMBER = '#D29922';
const BLUE = '#3B82F6';
const PURPLE = '#8250DF';

const SLOTS = 6;

/** 某个格子在某个时刻显示某个值 */
const cell = (at, value, vis, accent) => ({ at, value, vis, accent });

const CAP = (no, title, sub, total, slots, extra) => ({
  id: `07-01-${no}`,
  no,
  title,
  sub,
  bookTag: 'KMP',
  variant: 'array',
  accentColor: '#DB2777',
  total,
  slots: slots === undefined ? SLOTS : slots,
  ...extra,
});

module.exports = [

  // =========================================================================
  CAP('01-typedef', 'typedef —— 约定与 match 表', '下标从 0 开始；match[j] 是 P[0..j] 的最长相等前后缀长度', 10, 6, {
    cells: [
      // 开头就把 P 的六个字符摆出来，全程不消失（后面每一步都在指这些位置）
      cell(0, 'a', [[0, 99]]), cell(1, 'b', [[0, 99]]), cell(2, 'a', [[0, 99]]),
      cell(3, 'b', [[0, 99]]), cell(4, 'a', [[0, 99]]), cell(5, 'c', [[0, 99]]),
    ],
    highlights: [
      // 逐个位置点亮点出 match 的值：0 0 1 2 3 0
      { at: 0, vis: [[0.8, 2.2]], color: AMBER },
      { at: 1, vis: [[2.2, 3.4]], color: AMBER },
      { at: 2, vis: [[3.4, 4.6]], color: GREEN },
      { at: 3, vis: [[4.6, 5.8]], color: GREEN },
      { at: 4, vis: [[5.8, 7.0]], color: GREEN },
      { at: 5, vis: [[7.0, 8.4]], color: RED },
    ],
    notes: [
      { x: 480, y: 210, anchor: 'middle', text: '模式串 P = a b a b a c      match = 0 0 1 2 3 0', mono: true,
        size: 12.5, color: PURPLE, vis: [[0.8, 4.6]] },
      { x: 480, y: 210, anchor: 'middle', text: 'match[3] = 2：「abab」的开头和结尾都有「ab」', mono: true,
        size: 12.5, color: GREEN, vis: [[4.6, 7.0]] },
      { x: 480, y: 210, anchor: 'middle', text: 'match[5] = 0：「ababac」前后缀一个都对不上', mono: true,
        size: 12.5, color: RED, vis: [[7.0, 99]] },
    ],
    steps: [
      { t: 0, text: 'KMP 需要两样东西：主串 S、模式串 P，以及一张 match 表' },
      { t: 0.8, text: '下标统一从 0 开始 —— 教材里常见 next[1] = 0 的写法，那是从 1 存串的习惯' },
      { t: 2.2, text: 'match[j] = P[0..j] 的**最长相等前后缀**长度（真的前后缀，不含整串）' },
      { t: 3.4, text: 'P[0..2] = "aba"：前缀 "a" 和后缀 "a" 相等 → match[2] = 1' },
      { t: 4.6, text: 'P[0..3] = "abab"：前缀 "ab" 和后缀 "ab" 相等 → match[3] = 2' },
      { t: 5.8, text: 'P[0..4] = "ababa"：前缀 "aba" 和后缀 "aba" 相等 → match[4] = 3' },
      { t: 7.0, text: 'P[0..5] = "ababac"：前后缀怎么都对不上 → match[5] = 0' },
      { t: 8.4, text: '这张表只取决于 P —— 换主串不用重算，这是 KMP 能工程化的关键' },
    ],
  }),

  // =========================================================================
  CAP('02-NaiveMatch', 'NaiveMatch —— 暴力匹配', '从每个位置起手逐字符比，最坏 O(n·m)', 12, 6, {
    cells: [
      // 主串 "ababac" 摆出来（P = "abab"，在主串里出现两次：下标 0 和 2）
      cell(0, 'a', [[0, 99]]), cell(1, 'b', [[0, 99]]), cell(2, 'a', [[0, 99]]),
      cell(3, 'b', [[0, 99]]), cell(4, 'a', [[0, 99]]), cell(5, 'c', [[0, 99]]),
    ],
    highlights: [
      // 第一轮：位置 0 起手，"abab" 全部比中
      { at: 0, vis: [[1.0, 2.0]], color: GREEN },
      { at: 1, vis: [[2.0, 3.0]], color: GREEN },
      { at: 2, vis: [[3.0, 4.0]], color: GREEN },
      { at: 3, vis: [[4.0, 5.0]], color: GREEN },
      // 第二轮：位置 1 起手，第一步就失败（b vs a）
      { at: 1, vis: [[5.6, 6.8]], color: RED },
      { at: 2, vis: [[6.8, 7.8]], color: AMBER },
      // 第三轮：位置 2 起手，又比中四个
      { at: 2, vis: [[8.0, 9.0]], color: GREEN },
      { at: 3, vis: [[9.0, 10.0]], color: GREEN },
      { at: 4, vis: [[10.0, 11.0]], color: GREEN },
      { at: 5, vis: [[11.0, 12.0]], color: GREEN },
    ],
    notes: [
      { x: 480, y: 210, anchor: 'middle', text: 'S = a b a b a c        P = a b a b', mono: true,
        size: 12.5, color: BLUE, vis: [[0.6, 5.6]] },
      { x: 480, y: 210, anchor: 'middle', text: '第 1 轮：i=0 起手，四个字符全中 → 找到下标 0', mono: true,
        size: 12.5, color: GREEN, vis: [[5.0, 5.6]] },
      { x: 480, y: 210, anchor: 'middle', text: '第 2 轮：i=1 起手，第 1 个字符就不等 → 整个作废', mono: true,
        size: 12.5, color: RED, vis: [[5.6, 8.0]] },
      { x: 480, y: 210, anchor: 'middle', text: '第 3 轮：i=2 起手，四个字符又全中 —— 前面比过的又比了一遍', mono: true,
        size: 12.5, color: GREEN, vis: [[8.0, 99]] },
    ],
    steps: [
      { t: 0, text: '暴力匹配：从主串每个位置起手，逐字符和模式串比' },
      { t: 1.0, text: 'i=0 起手：S[0]=a 对上 P[0]=a，两个指针一起前进' },
      { t: 2.0, text: 'S[1]=b 对上 P[1]=b —— 继续' },
      { t: 3.0, text: 'S[2]=a 对上 P[2]=a —— 继续' },
      { t: 4.0, text: 'S[3]=b 对上 P[3]=b —— 整个模式串比完，返回下标 0' },
      { t: 5.6, text: 'i=1 起手：S[1]=b 对上 P[0]=a，**第一个字符就不等**' },
      { t: 6.8, text: '这个起手位置作废，i 前进一格 —— 刚才比过的 b 又要重比' },
      { t: 8.0, text: 'i=2 起手：a、b、a、b 四个字符**又全比一遍**' },
      { t: 10.0, text: '这些比较里有一半是重复劳动 —— KMP 要省的就是这部分' },
      { t: 11.0, text: '最坏情况 S=aaaa...ab、P=aaab 时，每个位置都比 m 次 → O(n·m)' },
    ],
  }),

  // =========================================================================
  CAP('03-match', 'match —— 最长相等前后缀', '定义：P 的开头和结尾最多重叠多少个字符', 11, 6, {
    cells: [
      cell(0, 'a', [[0, 99]]), cell(1, 'b', [[0, 99]]), cell(2, 'a', [[0, 99]]),
      cell(3, 'b', [[0, 99]]), cell(4, 'a', [[0, 99]]), cell(5, 'c', [[0, 99]]),
    ],
    pointers: [
      // 前缀从左边数、后缀从右边数：同一个 k 下两边各指一格
      { label: 'pre', at: 0, vis: [[1.0, 7.2]], color: GREEN },
      { label: 'suf', at: 3, vis: [[1.0, 2.2]], color: AMBER },
      { label: 'suf', at: 4, vis: [[2.2, 3.6]], color: AMBER },
      { label: 'suf', at: 5, vis: [[3.6, 7.2]], color: AMBER },
    ],
    highlights: [
      { at: 0, vis: [[1.0, 2.2]], color: GREEN },
      { at: 2, vis: [[1.0, 2.2]], color: GREEN },
      { at: 0, vis: [[2.2, 3.6]], color: GREEN },
      { at: 1, vis: [[2.2, 3.6]], color: GREEN },
      { at: 2, vis: [[2.2, 3.6]], color: GREEN },
      { at: 3, vis: [[2.2, 3.6]], color: GREEN },
      { at: 1, vis: [[3.6, 5.0]], color: AMBER },
      { at: 4, vis: [[3.6, 5.0]], color: AMBER },
    ],
    notes: [
      { x: 480, y: 210, anchor: 'middle', text: 'j=2："aba" 的前缀 a == 后缀 a → 长度 1', mono: true,
        size: 12.5, color: GREEN, vis: [[1.0, 2.2]] },
      { x: 480, y: 210, anchor: 'middle', text: 'j=3："abab" 的前缀 ab == 后缀 ab → 长度 2', mono: true,
        size: 12.5, color: GREEN, vis: [[2.2, 3.6]] },
      { x: 480, y: 210, anchor: 'middle', text: 'j=4："ababa" 的前缀 aba == 后缀 aba → 长度 3', mono: true,
        size: 12.5, color: AMBER, vis: [[3.6, 5.0]] },
      { x: 480, y: 210, anchor: 'middle', text: 'j=5："ababac" 前后缀都对不上 → 0（不是"差不多"，是严格相等）', mono: true,
        size: 12.5, color: RED, vis: [[5.0, 99]] },
    ],
    steps: [
      { t: 0, text: '这一节只有一个定义，但它就是整个 KMP 的地基' },
      { t: 1.0, text: 'j=2：看 "aba" —— 前缀取 "a"、后缀取 "a"，相等 → match[2] = 1' },
      { t: 2.2, text: 'j=3：看 "abab" —— 前缀 "ab"、后缀 "ab" 相等 → match[3] = 2' },
      { t: 3.6, text: 'j=4：看 "ababa" —— 前缀 "aba"、后缀 "aba" 相等 → match[4] = 3' },
      { t: 5.0, text: 'j=5：看 "ababac" —— 结尾是 c，任何长度的前后缀都不相等 → 0' },
      { t: 6.4, text: '两个限定要记牢：必须是**真**前后缀（不能是整个串），而且必须**严格相等**' },
      { t: 7.8, text: '为什么要这个数？它回答："开头和结尾最多重叠几个字符"' },
      { t: 9.0, text: '失配时，这段重叠的内容已经确认匹配过了，**没必要重比**' },
      { t: 9.8, text: '所以模式串能直接从 match[j-1] 那个位置接着比 —— 这就是"滑"的依据' },
    ],
  }),

  // =========================================================================
  CAP('04-buildMatch', 'buildMatch —— 递推建表', '用上一位的结果推下一位，O(m)', 12, 6, {
    cells: [
      // 第一次：match 表的前三位（0 0 1）
      cell(0, '0', [[0.8, 3.4]], 'new'), cell(1, '0', [[1.6, 3.4]], 'new'),
      cell(2, '1', [[2.4, 3.4]], 'new'),
      // 第二次：继续推 2、3
      cell(0, '0', [[3.4, 6.2]]), cell(1, '0', [[3.4, 6.2]]), cell(2, '1', [[3.4, 6.2]]),
      cell(3, '2', [[4.4, 6.2]], 'new'), cell(4, '3', [[5.4, 6.2]], 'new'),
      // 第三次：最后一位是 0（退到底都没接上）
      cell(0, '0', [[6.2, 8.6]]), cell(1, '0', [[6.2, 8.6]]), cell(2, '1', [[6.2, 8.6]]),
      cell(3, '2', [[6.2, 8.6]]), cell(4, '3', [[6.2, 8.6]]),
      cell(5, '0', [[7.2, 8.6]], 'del'),
      // 结尾：完整表留到结束
      cell(0, '0', [[8.6, 99]]), cell(1, '0', [[8.6, 99]]), cell(2, '1', [[8.6, 99]]),
      cell(3, '2', [[8.6, 99]]), cell(4, '3', [[8.6, 99]]), cell(5, '0', [[8.6, 99]]),
    ],
    pointers: [
      { label: 'j', at: 1, vis: [[1.6, 2.4]], color: AMBER },
      { label: 'j', at: 2, vis: [[2.4, 3.4]], color: AMBER },
      { label: 'j', at: 3, vis: [[4.4, 5.4]], color: AMBER },
      { label: 'j', at: 4, vis: [[5.4, 6.2]], color: AMBER },
      { label: 'j', at: 5, vis: [[7.2, 8.6]], color: RED },
    ],
    notes: [
      { x: 480, y: 210, anchor: 'middle', text: 'P = a b a b a c      match 表逐位算出来：0 0 1 2 3 0', mono: true,
        size: 12.5, color: BLUE, vis: [[0.8, 3.4]] },
      { x: 480, y: 210, anchor: 'middle', text: '能接上就 +1：P[j] == P[match[j-1]] → match[j] = match[j-1] + 1', mono: true,
        size: 12.5, color: GREEN, vis: [[3.4, 6.2]] },
      { x: 480, y: 210, anchor: 'middle', text: '接不上就退：k = match[k-1]，一直退到能接上或退成 0', mono: true,
        size: 12.5, color: RED, vis: [[6.2, 99]] },
    ],
    steps: [
      { t: 0, text: 'match 表要 O(m) 算出来 —— 靠的是"用上一位推下一位"' },
      { t: 0.8, text: '起点固定：match[0] = 0，长度 1 的串没有真前后缀' },
      { t: 1.6, text: 'j=1：P[1]=b 和 P[0]=a 不等，退到 0 还是不等 → match[1] = 0' },
      { t: 2.4, text: 'j=2：P[2]=a 和 P[0]=a 相等 → match[2] = match[1] + 1 = 1' },
      { t: 3.4, text: '前三位出来了：0 0 1。接下来是递推最关键的两步' },
      { t: 4.4, text: 'j=3：P[3]=b 和 P[1]=b 相等 → match[3] = match[2] + 1 = 2' },
      { t: 5.4, text: 'j=4：P[4]=a 和 P[2]=a 相等 → match[4] = match[3] + 1 = 3' },
      { t: 6.2, text: 'j=5：P[5]=c 和 P[3]=b 不等 —— 这时候要**退一步**看次长的候选' },
      { t: 7.2, text: '退到 k = match[2] = 1：再比 P[5]=c 和 P[1]=b，还是不等' },
      { t: 8.6, text: '退到 k = 0 仍不等 → match[5] = 0。完整表：0 0 1 2 3 0' },
      { t: 9.8, text: '内层虽然是个 while，但每次退至少减 1，总共退不过 m 次 → 整体 O(m)' },
    ],
  }),

  // =========================================================================
  CAP('05-KMPMatch', 'KMPMatch —— 主串指针不后退', '失配时只动模式串：j = match[j-1]', 13, 6, {
    cells: [
      // 主串 "ababac" 全程可见：i 指针一路向右，从不回头
      cell(0, 'a', [[0, 99]]), cell(1, 'b', [[0, 99]]), cell(2, 'a', [[0, 99]]),
      cell(3, 'b', [[0, 99]]), cell(4, 'a', [[0, 99]]), cell(5, 'c', [[0, 99]]),
    ],
    pointers: [
      // i 只向右走：这就是 KMP 的核心主张
      { label: 'i', at: 0, vis: [[0.8, 2.6]], color: BLUE },
      { label: 'i', at: 1, vis: [[2.6, 4.0]], color: BLUE },
      { label: 'i', at: 2, vis: [[4.0, 5.4]], color: BLUE },
      { label: 'i', at: 3, vis: [[5.4, 7.0]], color: BLUE },
      { label: 'i', at: 4, vis: [[7.0, 9.4]], color: BLUE },
      { label: 'i', at: 5, vis: [[9.4, 99]], color: BLUE },
      // 失配后 j 回退到 1：同一格上出现第二个指针，靠颜色和标签区分
      { label: 'j=1', at: 1, vis: [[7.0, 9.4]], color: RED },
    ],
    highlights: [
      { at: 0, vis: [[0.8, 2.6]], color: GREEN },
      { at: 1, vis: [[2.6, 4.0]], color: GREEN },
      { at: 2, vis: [[4.0, 5.4]], color: GREEN },
      { at: 3, vis: [[5.4, 7.0]], color: GREEN },
      { at: 4, vis: [[7.0, 7.6]], color: GREEN },
      { at: 4, vis: [[7.6, 9.4]], color: RED },
      { at: 5, vis: [[9.4, 99]], color: GREEN },
    ],
    notes: [
      { x: 480, y: 210, anchor: 'middle', text: 'S = a b a b a c   P = a b a b   match = 0 0 1 2', mono: true,
        size: 12.5, color: BLUE, vis: [[0.8, 7.0]] },
      { x: 480, y: 210, anchor: 'middle', text: 'S[4]=a 和 P[4] 越界 —— 其实这里 P 已经比完四个字符了', mono: true,
        size: 12.5, color: AMBER, vis: [[7.0, 7.6]] },
      { x: 480, y: 210, anchor: 'middle', text: '失配：j = match[j-1] = match[3] = 2 → 模式串滑到第 2 位接着比', mono: true,
        size: 12.5, color: RED, vis: [[7.6, 9.4]] },
      { x: 480, y: 210, anchor: 'middle', text: 'i 一直没回头 —— 这就是 KMP 省下的重复比较', mono: true,
        size: 12.5, color: GREEN, vis: [[9.4, 99]] },
    ],
    steps: [
      { t: 0, text: 'KMP 的全部秘密就在这三行：匹配则同进、失配则退 j、j 到底才动 i' },
      { t: 0.8, text: 'i=0、j=0：S[0]=a 和 P[0]=a 相等 → 两个指针一起前进' },
      { t: 2.6, text: 'i=1、j=1：S[1]=b 和 P[1]=b 相等 → 继续前进' },
      { t: 4.0, text: 'i=2、j=2：S[2]=a 和 P[2]=a 相等 → 继续前进' },
      { t: 5.4, text: 'i=3、j=3：S[3]=b 和 P[3]=b 相等 —— 模式串前四位全都比中了' },
      { t: 7.0, text: '下一步 S[4]=a 对 P[4]：模式串只有 4 位，j 已经到 4 —— 其实是**越界**，等价于失配' },
      { t: 7.6, text: '关键动作：j = match[j-1] = match[3] = 2。**i 不动**，模式串滑到第 2 位' },
      { t: 9.4, text: '接着比 S[4]=a 和 P[2]=a、S[5]=c 和 P[3]=b —— 前面那两位不用重比了' },
      { t: 10.8, text: 'j 每次至少退 1，而它总共只涨过 n 次 → 循环总次数 O(n)' },
      { t: 11.8, text: '加上预处理模式串的 O(m)：**KMP 最坏也是 O(n + m)**，暴力匹配最坏是 O(n·m)' },
    ],
  }),

  // =========================================================================
  CAP('06-main', 'main —— 两个算法对跑', '同一组输入，结果必须一致', 11, 6, {
    cells: [
      // 格子一直显示主串 —— 这套阵列渲染器就是用来摆数据的，
      // 结果（下标 / -1）放在下方的标注里，用颜色区分"找到"和"找不到"。
      cell(0, 'a', [[0, 99]]), cell(1, 'b', [[0, 99]]), cell(2, 'a', [[0, 99]]),
      cell(3, 'b', [[0, 99]]), cell(4, 'a', [[0, 99]]), cell(5, 'c', [[0, 99]]),
    ],
    highlights: [
      // 场景 1：P="abab" 命中下标 0（点到 0~3 格）
      { at: 0, vis: [[0.8, 2.4]], color: GREEN }, { at: 1, vis: [[0.8, 2.4]], color: GREEN },
      { at: 2, vis: [[0.8, 2.4]], color: GREEN }, { at: 3, vis: [[0.8, 2.4]], color: GREEN },
      // 场景 2：P="aaab" 在 S 里不存在 —— 整排点红
      { at: 0, vis: [[2.4, 4.2]], color: RED }, { at: 1, vis: [[2.4, 4.2]], color: RED },
      { at: 2, vis: [[2.4, 4.2]], color: RED }, { at: 3, vis: [[2.4, 4.2]], color: RED },
      { at: 4, vis: [[2.4, 4.2]], color: RED }, { at: 5, vis: [[2.4, 4.2]], color: RED },
      // 场景 3：P="abac" 命中下标 2（点到 2~5 格）
      { at: 2, vis: [[4.2, 5.8]], color: GREEN }, { at: 3, vis: [[4.2, 5.8]], color: GREEN },
      { at: 4, vis: [[4.2, 5.8]], color: GREEN }, { at: 5, vis: [[4.2, 5.8]], color: GREEN },
      // 场景 4：找到下标 2 之后，逐格确认两个算法给的下标相同
      { at: 0, vis: [[5.8, 7.4]], color: AMBER }, { at: 1, vis: [[5.8, 7.4]], color: AMBER },
      { at: 2, vis: [[6.6, 8.2]], color: AMBER }, { at: 3, vis: [[6.6, 8.2]], color: AMBER },
      { at: 4, vis: [[7.4, 9.0]], color: AMBER }, { at: 5, vis: [[7.4, 9.0]], color: AMBER },
    ],
    notes: [
      { x: 480, y: 210, anchor: 'middle', text: 'S = a b a b a c     ①P="abab" → 两个算法都给 0', mono: true,
        size: 12.5, color: GREEN, vis: [[0.8, 2.4]] },
      { x: 480, y: 210, anchor: 'middle', text: '②P="aaab" → 两个算法都给 -1（找不到时也必须一致）', mono: true,
        size: 12.5, color: RED, vis: [[2.4, 4.2]] },
      { x: 480, y: 210, anchor: 'middle', text: '③P="abac" → 两个算法都给 2', mono: true,
        size: 12.5, color: GREEN, vis: [[4.2, 5.8]] },
      { x: 480, y: 210, anchor: 'middle', text: '④P="xyz" → 两个算法都给 -1　　四组结果两两相同', mono: true,
        size: 12.5, color: AMBER, vis: [[5.8, 99]] },
    ],
    steps: [
      { t: 0, text: '把两个算法放在同一组数据上跑，看它们给的结果是否一致' },
      { t: 0.8, text: '场景 1：S="ababac"、P="abab" —— 命中下标 0，两个算法都该返回 0' },
      { t: 1.6, text: 'NaiveMatch 从头逐格比，KMPMatch 靠 match 表跳过重复比较' },
      { t: 2.4, text: '场景 2：P="aaab" 在 S 里根本不存在 —— 两个算法都该返回 -1' },
      { t: 3.4, text: '找不到的情况最容易被写错：退化成死循环或者漏判都会在这暴露' },
      { t: 4.2, text: '场景 3：P="abac" 命中下标 2 —— 两个算法都该返回 2' },
      { t: 5.0, text: '注意这里比的是"第一次出现的位置"，不是"出现过几次"' },
      { t: 5.8, text: '场景 4：P="xyz" 同样返回 -1，四组结果逐格对完' },
      { t: 7.4, text: '四组结果两两相同：KMP 只改"比较次数"，**不改答案**' },
      { t: 8.6, text: '这就是对拍：拿一个肯定对但慢的版本，去校验快版本的正确性' },
      { t: 9.6, text: 'KMP 的 O(n+m) 是最坏情况的保证 —— 而暴力匹配最坏是 O(n·m)' },
    ],
  }),
];
