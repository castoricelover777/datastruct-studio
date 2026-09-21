#%module | 01 | MaxSubseqSum1 | 算法1 —— 三重循环 O(n³) | 2 |
#%summary | 把所有子列都枚举一遍，最笨但最好懂。
#@d ============ 思路：枚举所有子列 ============
#@d
#@d 一个子列由"左端 i"和"右端 j"唯一确定，那就把 i、j 的所有组合都试一遍，
#@d 再把 i 到 j 之间的数加起来。
#@d
#@d   数组： -2  11  -4  13  -5  -2
#@d           0   1   2   3   4   5
#@d
#@d   左端 i=0 时：试 j=0,1,2,...,5        （6 个子列）
#@d   左端 i=1 时：试 j=1,2,...,5          （5 个子列）
#@d   ...
#@d   一共 N(N+1)/2 个子列
#@d
#@d 然后每个子列还要从头加一遍，最坏要加 N 次 —— 所以是 O(N³)。
#@d
#@d 注意不是无脑的 N³ 次循环：实际的比较次数是 N(N+1)(N+2)/6，
#@d 但常数不影响量级，写成 O(N³) 就够了。
#@d
#@d ============ 这层循环在干嘛 ============
#@d
#@d   i：子列左端
#@d   j：子列右端
#@d   k：把 i..j 之间重新加一遍 ← **这一层是多余的**
#@d
#@d 记住这个 k 循环，下一个算法就是把它省掉。
#@d
#@d ============ 和 C 的差别 ============
#@d
#@d   C 里要自己声明 int i, j, k 三个循环变量，Python 用 for ... in range 直接生成。
#@d   range(i, N) 对应 C 的 for (j = i; j < N; j++)，右端不包含。
#@d   内层 range(i, j + 1) 对应 for (k = i; k <= j; k++)，这里要加 1 才对得上。

#@s 返回最大子列和；全负时返回 0
def MaxSubseqSum1(A, N):
    #@s 至今为止的最大值，从 0 开始（对应"空子列"）
    maxSum = 0

    #@s 枚举左端
    for i in range(N):
        #@s 枚举右端
        for j in range(i, N):
            #@s 把 i..j 重新加一遍 —— 这一层是浪费的
            thisSum = 0
            for k in range(i, j + 1):
                thisSum += A[k]
            #@s 更大就记下来
            if thisSum > maxSum:
                maxSum = thisSum

    #@s 返回
    return maxSum
#%end

#%module | 02 | MaxSubseqSum2 | 算法2 —— 两重循环 O(n²) | 2 | 01 |
#%summary | 把最里面那层去掉：右端每往右移一格，就在原来的和上再加一个。
#@d ============ 关键观察 ============
#@d
#@d 算法 1 里，固定左端 i 之后，j 从 i 慢慢涨上去，
#@d 每换一个 j 就把 i..j 从头重加一遍 —— 但上一轮的加和明明还能用！
#@d
#@d     j=i   ：A[i]
#@d     j=i+1 ：A[i] + A[i+1]           = 上一轮的和 + A[i+1]
#@d     j=i+2 ：A[i] + A[i+1] + A[i+2]   = 上一轮的和 + A[i+2]
#@d
#@d 所以把 thisSum 提到 j 循环**外面**、每轮只加**一个新元素**，
#@d 内层那个 k 循环就没了 —— O(N³) 直接降到 O(N²)。
#@d
#@d ============ 这是最常见的优化手法 ============
#@d
#@d 找出"重复计算的部分"，把它缓存下来复用。
#@d 后面动态规划、前缀和、滑动窗口，本质都是这个思路。
#@d 区别只在于"缓存什么、怎么复用"。
#@d
#@d ============ 和 C 的差别 ============
#@d
#@d   几乎一模一样。C 里 thisSum 要在循环外声明成 int，
#@d   Python 直接赋值就行，不用提前声明。

#@s 返回最大子列和
def MaxSubseqSum2(A, N):
    #@s 最大值
    maxSum = 0

    #@s 枚举左端
    for i in range(N):
        #@s 每换一个左端，重新开始累加
        thisSum = 0

        #@s 右端向右推进
        for j in range(i, N):
            #@s 只加"新进来的那个元素" —— 不再重头加
            thisSum += A[j]

            #@s 边加边比较，所以不需要第三层循环
            if thisSum > maxSum:
                maxSum = thisSum

    #@s 返回
    return maxSum
#%end

#%module | 03 | MaxSubseqSum3 | 算法3 —— 分治 O(n log n) | 3 | 01 |
#%summary | 从中间劈成两半，答案要么在左半、要么在右半、要么跨过中线。
#@d ============ 分治的思路 ============
#@d
#@d 把数组从中间切成两半，那么最大子列只可能出现在三个地方：
#@d
#@d   ① 完全在左半边
#@d   ② 完全在右半边
#@d   ③ 跨过中线（左半的一部分 + 右半的一部分）
#@d
#@d   数组： -2  11  -4 │ 13  -5  -2
#@d                     ↑ 中线
#@d
#@d ① 和 ② 就是递归 —— 把左右两半各自当成一个更小的问题。
#@d ③ 只能硬算，但有个好办法：从中线出发往两边扫。
#@d
#@d ============ 跨界那部分怎么算 ============
#@d
#@d 跨界的子列一定**包含中线两侧紧邻的元素**，而且是从中线往两边连续延伸的。
#@d 所以：
#@d
#@d   往左扫：从中线开始往左累加，记录"左边的最大后缀和"
#@d   往右扫：从中线右边开始往右累加，记录"右边的最大前缀和"
#@d   两者相加 = 跨界的最大和
#@d
#@d 各扫一遍是 O(N)，加上递归的两半 T(N/2)：
#@d
#@d   T(N) = 2·T(N/2) + O(N)   →   O(N log N)
#@d
#@d ============ 代价 ============
#@d
#@d 比算法 2 快，但代码复杂得多，而且递归要占栈空间。
#@d 更要命的是：**下一个算法只要 8 行代码，还是 O(N)**。
#@d
#@d ============ Python 里递归有个坑 ============
#@d
#@d   数据量大时 Python 会报 RecursionError，因为默认递归深度只有 1000。
#@d   C 没这个问题（栈更大）。真要跑大数据，得把递归改成循环，
#@d   或者用 sys.setrecursionlimit 调高上限。
#@d
#@d   另外 C 的 `A[left] > 0 ? A[left] : 0` 三元表达式，
#@d   Python 写成 `A[left] if A[left] > 0 else 0`，顺序正好是反的，别写顺手了。

#@s 从 left 到 right（闭区间）的最大子列和
def MaxSubseqSum3(A, left, right):
    #@s 递归出口：只剩一个元素
    if left == right:
        #@d 单个负数对"最大和"没有贡献（还不如空子列 0），所以返回 0。
        return A[left] if A[left] > 0 else 0

    #@s 从中线劈开
    mid = (left + right) // 2

    #@s ① 左半边的最大子列和
    leftSum = MaxSubseqSum3(A, left, mid)

    #@s ② 右半边的最大子列和
    rightSum = MaxSubseqSum3(A, mid + 1, right)

    #@s ③ 跨过中线的最大子列和：先从中线往左扫
    #@d 从中线开始**往左**累加（i 递减），一路记录最大值。
    #@d 这样得到的是"以中线结尾的最大后缀和"。
    #@d range(mid, left - 1, -1) 对应 C 的 for (i = mid; i >= left; i--)。
    maxLeft = 0
    s = 0
    for i in range(mid, left - 1, -1):
        s += A[i]
        if s > maxLeft:
            maxLeft = s

    #@s 再从中线右边往右扫
    #@d 同理，得到"从中线右边开始的最大前缀和"。
    #@d 左边后缀 + 右边前缀，拼起来就是跨界的最大和 —— 而且它一定是连续的。
    maxRight = 0
    s = 0
    for i in range(mid + 1, right + 1):
        s += A[i]
        if s > maxRight:
            maxRight = s

    #@s 跨界的结果
    crossSum = maxLeft + maxRight

    #@s 三者取最大
    #@d C 里手写两次 if 比较，Python 直接 if 或者用内置的 max() 都行。
    if leftSum < rightSum:
        leftSum = rightSum
    if leftSum < crossSum:
        leftSum = crossSum

    #@s 返回
    return leftSum
#%end

#%module | 04 | MaxSubseqSum4 | 算法4 —— 在线处理 O(n) | 3 | 01 |
#%summary | 从头扫一遍，只要当前和变成负的就立刻扔掉重新开始。
#@d ============ 全部代码只有这么几行 ============
#@d
#@d    for (i = 0; i < N; i++) {
#@d        thisSum += A[i];
#@d        if (thisSum > maxSum) maxSum = thisSum;
#@d        else if (thisSum < 0) thisSum = 0;
#@d    }
#@d
#@d 但它凭什么对？
#@d
#@d ============ 为什么"和为负就扔掉"是对的 ============
#@d
#@d 假设扫到某个位置时 thisSum 已经变成负数了。
#@d 那么对于**后面任何一个**子列来说，如果它包含了这一段负的和，
#@d 把它去掉只会更大 —— 所以这一段永远不需要再被带上。
#@d
#@d   数组：  3  -5  2  4
#@d           ↑
#@d   扫到 -5 时 thisSum = 3 + (-5) = -2 < 0
#@d
#@d   后面不管接什么，带着这 -2 都不如不带。
#@d   所以干脆从下一个位置重新开始数。
#@d
#@d ============ "在线"是什么意思 ============
#@d
#@d 它只需要**读一遍**数据，而且每读一个数就能立刻给出"到目前为止的答案"。
#@d 就算数据是一个一个流过来、存不下来，它照样能算。
#@d
#@d 这种性质叫**在线算法（online algorithm）**。
#@d 前三个算法都做不到 —— 它们必须先把整个数组拿在手里反复看。
#@d
#@d ============ 顺带一提 ============
#@d
#@d 这个算法和"最大子段和"的动态规划写法是同一个东西：
#@d
#@d   dp[i] = max(A[i], dp[i-1] + A[i])
#@d
#@d 只不过这里用 thisSum 把 dp 数组省成了一个变量 —— 空间从 O(N) 降到 O(1)。

#@s 返回最大子列和
def MaxSubseqSum4(A, N):
    #@s 当前正在累加的这一段的和
    thisSum = 0
    #@s 至今为止的最大值
    maxSum = 0

    #@s 从头扫到尾，只扫一遍
    for i in range(N):
        #@s 先把当前元素加进来
        thisSum += A[i]

        #@s 变大了就更新答案
        #@d 注意这一步在"判负"之前 —— 因为加上一个正数之后可能刚好是最大值。
        if thisSum > maxSum:
            maxSum = thisSum
        #@s 变成负的就没用了，扔掉重来
        #@d 用 elif 而不是再写一个 if：两者不可能同时成立（thisSum 不可能既大于 maxSum
        #@d 又小于 0，因为 maxSum 至少是 0）。写成两个 if 也不会错，但没必要。
        elif thisSum < 0:
            thisSum = 0

    #@s 返回
    return maxSum
#%end

#%module | 05 | main | main —— 四种算法一起跑 | 2 | 01,02,03,04 |
#%summary | 同一个输入，四个算法必须给出同一个答案。
#@d ============ 为什么要"四个答案互相对账" ============
#@d
#@d 这四个算法思路完全不同，但它们**必须算出同一个数**。
#@d 如果有一个不一样，那一定是写错了 —— 这种"多解法互验"是很有用的调试手段，
#@d 尤其在你不确定哪个对的时候。
#@d
#@d 然后看代码长度：从 30 行缩到 8 行，复杂度从 O(N³) 降到 O(N)。
#@d 这就是"好的算法"值钱的地方。
#@d
#@d ============ 和 C 的差别 ============
#@d
#@d   C 里用 sizeof 算数组长度：#define N ((int)(sizeof(kData)/sizeof(kData[0])))
#@d   Python 直接 len(kData)，不用管每个元素占几个字节。
#@d
#@d   C 的 printf 要写格式串（%d）和换行符（\n），
#@d   Python 用 f-string 把变量直接写进字符串里，换行由 print 自动加。

#@s 测试数据：有正有负，答案应该是 20（11 + (-4) + 13）
kData = [-2, 11, -4, 13, -5, -2]

#@s 主函数：Python 用 if __name__ 的固定写法代替 C 的 main
if __name__ == '__main__':
    #@s 元素个数
    N = len(kData)

    #@s 打印输入
    #@d C 里是 printf("输入: ") 然后循环 printf("%d ", ...)，
    #@d 每个数字后面都跟一个空格（含最后一个），所以行尾有一个空格。
    #@d 这里照着做，两种语言的输出才能逐字节相同。
    print('输入: ', end='')
    for x in kData:
        print(x, end=' ')
    print()
    print()

    #@s 逐个跑，并打印各自的答案
    #@d 手工的算法分析看不出快慢，但把 N 放大到几万时，四个算法的耗时差别是
    #@d 天壤之别（O(N³) 要跑几分钟，O(N) 一瞬间）。这里数据小，只对比答案。
    r1 = MaxSubseqSum1(kData, N)
    print(f'算法1 三重循环 O(N^3)   -> {r1}')

    r2 = MaxSubseqSum2(kData, N)
    print(f'算法2 两重循环 O(N^2)   -> {r2}')

    r3 = MaxSubseqSum3(kData, 0, N - 1)
    print(f'算法3 分治     O(NlogN) -> {r3}')

    r4 = MaxSubseqSum4(kData, N)
    print(f'算法4 在线处理 O(N)     -> {r4}')

    #@s 四个答案必须一致
    print()
    if r1 == r2 and r2 == r3 and r3 == r4:
        print(f'四种算法答案一致：{r1}')
    else:
        print('答案不一致 —— 有算法写错了！')

    #@s 边界情况：全是负数
    #@d 题目约定"空子列的和为 0"，所以全负时答案是 0 而不是最大的那个负数。
    neg = [-3, -1, -7, -2]
    n = len(neg)
    print()
    print(f'全是负数时: {MaxSubseqSum1(neg, n)} {MaxSubseqSum2(neg, n)} '
          f'{MaxSubseqSum3(neg, 0, n - 1)} {MaxSubseqSum4(neg, n)}')
    print('（约定：空子列的和为 0，所以答案是 0）')
#%end
