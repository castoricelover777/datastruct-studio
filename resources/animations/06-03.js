'use strict';
/**
 * 06-03 分离链接法 —— 动画场景
 *
 * 用图渲染器画「桶数组 + 挂在后面的链表」，这是它最直观的表示。
 * 全篇用 5 个桶，方便画下。
 */

const GREEN = '#10B981';
const RED = '#EF4444';
const AMBER = '#D29922';
const BLUE = '#3B82F6';

const N = (id, label, x, y, state) => ({ id, label, x, y, state });
const E = (from, to, state) => ({ from, to, state, directed: true });

const BX = 195;       // 桶的 x
const NX0 = 350;      // 第一个链表结点的 x
const DX = 82;        // 结点间距
const rowY = (i) => 106 + i * 42;

/**
 * chains[i] 是第 i 个桶挂的元素数组（按链表顺序，从头到尾）
 * extra 用 'b0' / 'n0_1' 这样的 id 覆盖单个结点状态
 */
function layout(chains, vis, extra) {
  const gnodes = [];
  const gedges = [];

  for (let i = 0; i < 5; i++) {
    gnodes.push(N('b' + i, String(i), BX, rowY(i),
      Object.assign({ vis }, (extra && extra['b' + i]) || {})));
  }

  for (let i = 0; i < 5; i++) {
    const chain = chains[i] || [];
    let prev = 'b' + i;
    chain.forEach((v, k) => {
      const id = 'n' + i + '_' + k;
      gnodes.push(N(id, String(v), NX0 + k * DX, rowY(i),
        Object.assign({ vis }, (extra && extra[id]) || {})));
      gedges.push(E(prev, id, Object.assign({ vis }, (extra && extra['e' + i + '_' + k]) || {})));
      prev = id;
    });
  }
  return { gnodes, gedges };
}

const CAP = (no, title, sub, total, chains, vis, extra, more) => Object.assign({
  id: `06-03-${no}`,
  no,
  title,
  sub,
  bookTag: '分离链接法',
  variant: 'graph',
  accentColor: '#8250DF',
  total,
}, layout(chains, vis, extra), more || {});

const ALL = [[0, 11, 22, 33], [1], [], [4, 15], []];

module.exports = [

  // =========================================================================
  CAP('01-typedef', 'typedef —— 数组 + 链表', '每格不再存元素，而是存一条链表的头', 10,
    [[], [], [], [], []], [[0.6, 10]],
    { b0: { accent: 'hot' }, b1: {}, b2: {}, b3: {}, b4: {} },
    {
      notes: [
        { x: 480, y: 258, anchor: 'middle', text: '5 个桶，每格是一个「虚拟头结点」（Data 字段不用）', size: 12.5,
          color: BLUE, vis: [[1.4, 6.0]] },
        { x: 480, y: 258, anchor: 'middle', text: '虚拟头结点的好处：插入不用特判空链、删除不用特判首结点', size: 12.5,
          color: AMBER, vis: [[6.0, 9.0]] },
        { x: 480, y: 258, anchor: 'middle', text: '装填因子在这里 = 平均链表长度，**可以大于 1**', size: 12.5,
          color: GREEN, vis: [[9.0, 10]] },
      ],
      steps: [
        { t: 0, text: '上一节开放地址法是"冲突了就另找一个空位"，这一节换个办法' },
        { t: 1.4, text: '**分离链接法：冲突了就挂在同一条链表上**' },
        { t: 2.6, text: '数组的每格不再存"一个元素"，而是存"一条链表的头"' },
        { t: 3.4, text: '看左边的方块 —— 那就是 5 个桶' },
        { t: 4.4, text: '每个桶本身是一个 LNode，但它的 Data 字段**不用**，只用 Next' },
        { t: 5.2, text: '这叫**虚拟头结点**，好处是省掉一堆特判' },
        { t: 6.0, text: '① 插入时不用特判"链表还空着"' },
        { t: 6.6, text: '② 删除时不用特判"删的是第一个结点"' },
        { t: 8.0, text: '和开放地址法最直接的区别：**这里不需要留空位**' },
        { t: 8.6, text: '所以装填因子（= 平均链表长度）**可以大于 1**' },
        { t: 9.4, text: 'α = 3 意味着平均每条链挂 3 个元素，查找走 3 步 —— 还是常数级' },
      ],
    }
  ),

  // =========================================================================
  CAP('02-Hash', 'Hash —— 散列定位到桶', '算出的位置就是最终归属', 9,
    ALL, [[1.0, 9]],
    {
      b0: { accent: 'hot' }, n0_0: { accent: 'new' }, n0_1: { accent: 'new' },
      n0_2: { accent: 'new' }, n0_3: { accent: 'new' },
      b1: { accent: 'new' }, n1_0: { accent: 'new' },
      b3: { accent: 'new' }, n3_0: { accent: 'new' }, n3_1: { accent: 'new' },
    },
    {
      notes: [
        { x: 480, y: 258, anchor: 'middle', text: '11、22、33 都对 5 取余得 1？这里都落在 0 号桶', mono: true,
          size: 12.5, color: AMBER, vis: [[1.4, 5.0]] },
        { x: 480, y: 258, anchor: 'middle', text: '开放地址法里散列位置只是「起点」，冲突了还要探测', size: 12.5,
          color: BLUE, vis: [[4.0, 8.0]] },
        { x: 480, y: 258, anchor: 'middle', text: '分离链接法里它是**最终归属** —— 挂哪条链之后就不动了', size: 12.5,
          color: GREEN, vis: [[6.5, 9]] },
      ],
      steps: [
        { t: 0, text: '散列函数的作用在这里变了' },
        { t: 1.4, text: '它算出的位置，决定了这个元素**挂在哪条链表上**' },
        { t: 2.6, text: '算完之后元素就在那条链上，不会再动 —— 没有"探测"这一步' },
        { t: 4.0, text: '对比一下：开放地址法里散列位置只是"起点"，冲突了还要往后探测' },
        { t: 5.2, text: '分离链接法里它是**最终归属**' },
        { t: 6.5, text: '所以散列函数的质量对这里影响更直接' },
        { t: 7.4, text: '散列函数好 → 各条链长度差不多 → 查找走几步就够' },
        { t: 8.0, text: '散列函数差 → 有的链很长、有的空着 → 长的那些退化成线性查找' },
        { t: 8.6, text: '看这张图：0 号桶挂了 4 个，2 号和 4 号空着 —— 这就是分布不均' },
      ],
    }
  ),

  // =========================================================================
  CAP('03-Find', 'Find —— 查找两步', '先散列定位，再顺链找', 11,
    ALL, [[1.2, 11]],
    {
      b0: { accent: 'hot' },
      n0_0: { accent: 'visited' }, n0_1: { accent: 'visited' },
      n0_2: { accent: 'new' }, n0_3: { accent: 'new' },
    },
    {
      notes: [
        { x: 480, y: 258, anchor: 'middle', text: '① 散列算出挂哪条链：O(1)', mono: true, size: 12.5,
          color: BLUE, vis: [[1.2, 4.0]] },
        { x: 480, y: 258, anchor: 'middle', text: '② 顺着那条链依次比较：O(链表长度)', mono: true, size: 12.5,
          color: AMBER, vis: [[4.0, 8.0]] },
        { x: 480, y: 258, anchor: 'middle', text: '合起来 O(1 + α)，α 是平均链表长度（装填因子）', mono: true,
          size: 12.5, color: GREEN, vis: [[8.0, 11]] },
      ],
      steps: [
        { t: 0, text: '查找就两步，非常简单' },
        { t: 1.2, text: '① 用散列函数算出挂在哪条链表上' },
        { t: 2.6, text: '② 顺着那条链表依次比较 —— 这一步就是**普通的链表查找**' },
        { t: 4.0, text: '所以整个复杂度可以拆开：O(1) + O(链表长度)' },
        { t: 5.4, text: '而链表长度平均就是 α，所以总的是 **O(1 + α)**' },
        { t: 6.6, text: '看这张图：找 33 的话，从 0 号桶出发走 3 步' },
        { t: 8.0, text: '和开放地址法一个细微差别：这里**不用区分"没找到"和"表满了"**' },
        { t: 8.8, text: '链表走到 NULL 就是没找到，干净利落' },
        { t: 9.6, text: '开放地址法要小心探测走遍全表还没找到的情况 —— 边界条件更多' },
        { t: 10.4, text: '所以分离链接法的**逻辑更简单，不容易出边界 bug**' },
      ],
    }
  ),

  // =========================================================================
  CAP('04-Insert', 'Insert —— 插入：先查重再头插', '新结点挂到链表最前面', 11,
    ALL, [[1.6, 11]],
    {
      b0: { accent: 'hot' },
      n0_0: { accent: 'new' }, n0_1: { accent: 'visited' },
      n0_2: { accent: 'visited' }, n0_3: { accent: 'visited' },
      e0_0: { accent: 'new' },
    },
    {
      notes: [
        { x: 480, y: 258, anchor: 'middle', text: '① 先 Find 查重 —— 已存在就不重复插入', mono: true, size: 12.5,
          color: BLUE, vis: [[1.6, 5.0]] },
        { x: 480, y: 258, anchor: 'middle', text: '② 造新结点，**头插**到那条链上：O(1)', mono: true, size: 12.5,
          color: GREEN, vis: [[5.0, 9.0]] },
        { x: 480, y: 258, anchor: 'middle', text: '后果：同一条链的顺序和插入顺序**相反**', size: 12.5,
          color: AMBER, vis: [[8.0, 11]] },
      ],
      steps: [
        { t: 0, text: '插入也是两步' },
        { t: 1.6, text: '① 先查找，看这个键是不是已经存在' },
        { t: 3.0, text: '散列表到底允不允许重复关键字？这取决于用途' },
        { t: 3.8, text: '作为「集合」用（去重）→ 不允许，插入前要查重' },
        { t: 4.4, text: '作为「多重集」用（统计词频）→ 允许，或者结点里加计数' },
        { t: 5.0, text: '② 不存在 → 造新结点，**头插**到对应链表上' },
        { t: 6.4, text: '头插只要 O(1)，不用找尾 —— 和邻接表里插件点的做法一样' },
        { t: 7.4, text: '代价是链表里的顺序和插入顺序**相反**' },
        { t: 8.0, text: '要按插入顺序输出的话，得改成尾插（多一个尾指针）或者插完反转' },
        { t: 9.0, text: '（Java 的 HashMap 采取的是"键相同就覆盖值"，也是一种处理方式）' },
        { t: 9.8, text: '注意：查重会让每次插入多走一次链表 —— 想省这点开销也可以不查' },
      ],
    }
  ),

  // =========================================================================
  CAP('05-Delete', 'Delete —— 删除：直接摘掉', '不需要墓碑', 12,
    [[0, 22, 33], [1], [], [4, 15], []], [[1.4, 12]],
    {
      b0: { accent: 'hot' },
      n0_0: { accent: 'visited' }, n0_1: { accent: 'del' }, n0_2: { accent: 'new' },
      e0_2: { accent: 'new' },
    },
    {
      notes: [
        { x: 480, y: 258, anchor: 'middle', text: '链表删除三步：找到**前驱** → 绕过它 → free', size: 12.5,
          color: BLUE, vis: [[1.4, 6.0]] },
        { x: 480, y: 258, anchor: 'middle', text: '为什么必须找前驱？单向链表里没法从当前结点回到前一个', size: 12.5,
          color: AMBER, vis: [[4.0, 9.0]] },
        { x: 480, y: 258, anchor: 'middle', text: '有虚拟头结点就不必特判「删的是第一个元素」', size: 12.5,
          color: GREEN, vis: [[7.0, 12]] },
        { x: 480, y: 258, anchor: 'middle', text: '摘掉之后剩下的结点之间的指针依然连着 —— 不用墓碑', size: 12.5,
          color: GREEN, vis: [[9.6, 12]] },
      ],
      steps: [
        { t: 0, text: '删除是分离链接法比开放地址法**明显更好**的地方' },
        { t: 1.4, text: '开放地址法里元素靠"数组位置"串成探测链，删中间一个会断链 → 只能标墓碑' },
        { t: 3.0, text: '这里元素靠"链表指针"连接，摘掉一个，剩下的还连着' },
        { t: 4.0, text: '所以直接 free 就行。链表删除的标准三步：' },
        { t: 4.6, text: '① 找到待删结点的**前一个**' },
        { t: 5.6, text: '② 前一个的 Next 指向待删结点的 Next（把它"绕过"）' },
        { t: 6.6, text: '③ free 掉待删结点' },
        { t: 7.0, text: '为什么必须找前驱？单向链表里你没法从当前结点回到前一个' },
        { t: 8.0, text: '所以删除必须从头开始找，不能只拿到当前结点指针' },
        { t: 8.6, text: '（双向链表能避免，但散列没必要为此付出额外空间）' },
        { t: 9.6, text: '有虚拟头结点之后，第 ① 步简单很多：前驱初始就是头结点' },
        { t: 10.4, text: '不用特判"删的是第一个真元素"这种情况' },
        { t: 11.2, text: '看这个例子：删掉 22，链变成 0 → 33，指针一切正常，没有墓碑' },
      ],
    }
  ),

  // =========================================================================
  CAP('06-PrintTable', 'PrintTable —— 看最长链表', '性能由最长的那条决定', 10,
    ALL, [[2.0, 10]],
    {
      b0: { accent: 'hot' }, n0_0: { accent: 'hot' }, n0_1: { accent: 'hot' },
      n0_2: { accent: 'hot' }, n0_3: { accent: 'hot' },
      b1: { accent: 'new' }, n1_0: { accent: 'new' },
      b3: { accent: 'new' }, n3_0: { accent: 'new' }, n3_1: { accent: 'new' },
      b2: { accent: 'del' }, b4: { accent: 'del' },
    },
    {
      notes: [
        { x: 480, y: 258, anchor: 'middle', text: '0 号桶挂 4 个，2 号和 4 号空着 —— 平均长度一样，但最长差很多',
          size: 12.5, color: RED, vis: [[2.0, 7.0]] },
        { x: 480, y: 258, anchor: 'middle', text: '所以光看平均装填因子不够，还要看**最长链表**有多长', size: 12.5,
          color: AMBER, vis: [[5.0, 10]] },
        { x: 480, y: 258, anchor: 'middle', text: 'Java 8：链表长度超过 8 就转红黑树 —— 把最坏从 O(n) 降到 O(log n)',
          size: 12.5, color: GREEN, vis: [[7.6, 10]] },
      ],
      steps: [
        { t: 0, text: '对分离链接法来说，**性能直接由最长的链表决定**' },
        { t: 2.0, text: '看这张图：0 号桶挂了 4 个元素，2 号和 4 号空着' },
        { t: 3.4, text: '平均长度可能只有 1.5，但最长是 4' },
        { t: 4.4, text: '那 4 个元素的查找都是 O(4)，比平均值差多了' },
        { t: 5.0, text: '所以光看平均装填因子不够，**最长链表**更值得关注' },
        { t: 6.0, text: '理论上 n 个元素散到 m 个桶里，最长链表大约是 O(log n / log log n)' },
        { t: 7.0, text: '但散列函数有缺陷时，最长链表可能长得多 —— 所以这个统计很有诊断价值' },
        { t: 7.6, text: 'Java 8 给 HashMap 加的规则就是这个思路的极致：' },
        { t: 8.4, text: '**链表长度超过 8 就转成红黑树**，把最坏情况从 O(n) 降到 O(log n)' },
        { t: 9.2, text: '这是"链表 + 树"的混合结构，兼顾了两者的优点' },
      ],
    }
  ),

  // =========================================================================
  CAP('07-main', 'main —— 两种冲突处理方式的取舍', '分离链接法 vs 开放地址法', 11,
    ALL, [[0.8, 11]],
    {
      b0: { accent: 'hot' }, n0_0: { accent: 'hot' }, n0_1: { accent: 'hot' },
      n0_2: { accent: 'hot' }, n0_3: { accent: 'hot' },
      b1: { accent: 'new' }, n1_0: { accent: 'new' },
      b3: { accent: 'new' }, n3_0: { accent: 'new' }, n3_1: { accent: 'new' },
    },
    {
      notes: [
        { x: 480, y: 258, anchor: 'middle', text: '分离链接法：α 可 > 1、删除不要墓碑；代价是 malloc 和缓存不友好', size: 12.5,
          color: BLUE, vis: [[2.0, 10]] },
        { x: 480, y: 258, anchor: 'middle', text: '开放地址法：α 必须 < 1、删除要墓碑；优势是顺序访问缓存友好', size: 12.5,
          color: AMBER, vis: [[4.6, 10]] },
        { x: 480, y: 258, anchor: 'middle', text: '元素数能预估、在意缓存 → 开放地址；数量不定、频繁删除 → 分离链接',
          size: 12.5, color: GREEN, vis: [[7.4, 11]] },
      ],
      steps: [
        { t: 0, text: '把分离链接法完整跑一遍，然后和开放地址法对比' },
        { t: 0.8, text: '插入 12 个元素到 5 个桶里 —— 装填因子是 2.4' },
        { t: 2.0, text: '**分离链接法的特点**：' },
        { t: 2.6, text: '· 装填因子可以大于 1（格子永远够用，链表能一直挂）' },
        { t: 3.4, text: '· 删除简单，直接从链表摘掉，不需要墓碑' },
        { t: 4.0, text: '· 代价：每个元素要 malloc 一次，链表结点在内存里是散的' },
        { t: 4.6, text: '**开放地址法的特点**：' },
        { t: 5.4, text: '· 装填因子必须小于 1，到 0.75 就该扩容' },
        { t: 6.2, text: '· 删除要留墓碑，否则探测链会断' },
        { t: 6.8, text: '· 优势：全在一个数组里，顺序访问对 CPU 缓存极友好' },
        { t: 7.4, text: '怎么选？' },
        { t: 8.0, text: '元素数能预估、在意缓存性能 → **开放地址法**' },
        { t: 8.8, text: '元素数不确定、频繁删除 → **分离链接法**' },
        { t: 9.6, text: '很多语言的字典实现是两者混合（Java 8 的 HashMap 就是链表转红黑树）' },
        { t: 10.4, text: '===== 到这里，陈越《数据结构》六章内容全部讲完了 =====' },
      ],
    }
  ),

];
