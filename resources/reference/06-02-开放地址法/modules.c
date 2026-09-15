/*
 * ============================================================================
 *  数据结构研习社 —— 06 散列 / 06-02 开放地址法
 * ============================================================================
 *
 *  上一节留下一个问题：**冲突了怎么办？**
 *
 *  开放地址法的回答是：**在表里另找一个空位。**
 *
 *      算出 h(k) = 5，但 5 号格被占了
 *      → 那就试试 6 号、7 号…… 找到空的就放进去
 *
 *  这个"试下一个"的规则叫**探测序列**，它决定了算法的全部性质：
 *
 *      线性探测  h(k) + i            →  简单，但会"扎堆"
 *      平方探测  h(k) ± i²           →  缓解扎堆，但可能探测不到全表
 *      双散列    h(k) + i × h₂(k)    →  效果最好，但要设计第二个函数
 *
 *  ============ 一个绕不开的指标：装填因子 ============
 *
 *      装填因子 α = 表中元素数 / 表长
 *
 *  它直接决定了探测要试多少次：
 *
 *      α = 0.5  →  线性探测平均约 1.5 次
 *      α = 0.9  →  线性探测平均约 5.5 次
 *      α → 1    →  迅速恶化到无法使用
 *
 *  所以开放地址法的表**不能装太满**。一般 α 超过 0.5~0.75 就要扩容。
 *  （这也是它相对分离链接法的劣势：链表可以一直挂下去，表满了才真没救。）
 *
 *  标记约定同前（本文件本身可编译）。
 * ============================================================================
 */

#include <stdio.h>
#include <stdlib.h>

//%module | 01 | typedef | 头文件与 typedef | 2 |
//%summary | 结构还是那个结构，重点是三种"探测"共用同一套格子。
//@d ============ 开放地址法和分离链接法的根本差别 ============
//@d
//@d   **开放地址法**：所有元素都存在**同一个数组**里，冲突了就另找空位
//@d   **分离链接法**：数组每格挂一条链表，冲突了就挂在链表上
//@d
//@d 所以开放地址法的数组必须**开得比元素多**（留出空位给探测），
//@d 而分离链接法的表长可以接近元素数。
//@d
//@d 反过来，开放地址法不需要任何指针和额外内存分配 —— 对缓存很友好，
//@d 实测往往比分离链接法快。这是个典型的"空间换时间 vs 时间换空间"的取舍。
//@d
//@d ============ 三种探测方式共用一套结构 ============
//@d
//@d 这一节的三种做法**只在"怎么算下一个位置"上不同**，其余完全一样：
//@d
//@d   线性探测：(h(k) + i) % TableSize
//@d   平方探测：(h(k) ± i²) % TableSize
//@d   双散列  ：(h(k) + i × h₂(k)) % TableSize
//@d
//@d 所以下面把它们写成三个查找函数，方便直接对比。
//@d 注意：**插入也靠查找** —— 先找到"该放的位置"，再填进去。
//@d 这也是散列实现的一个惯用手法：插入 = 查找 + 写入。

//@s 元素类型
typedef int ElementType;

//@s 下标类型
typedef int Index;

//@s 表的最大容量
#define MAXTABLESIZE 20000

//@s 格子的状态
typedef enum
{
//@s 从没放过
    Empty,
//@s 有元素
    Legitimate,
//@s 墓碑（删过东西）
    Deleted
} EntryType;

//@s 一个格子
typedef struct HashEntry Cell;
struct HashEntry
{
//@s 关键字
    ElementType Data;
//@s 状态
    EntryType Info;
};

//@s 散列表
typedef struct TblNode *HashTable;
struct TblNode
{
//@s 表长（素数）
    int TableSize;
//@s 格子数组
    Cell *Cells;
};

//@s 状态码
#define OK 1
#define ERROR 0
typedef int Status;

//@s 没找到
#define NOTFOUND (-1)

//@s 取不小于 N 的下一个素数（和 06-01 一样）
int NextPrime(int N)
{
//@s 循环用
    int i;
//@s 待检查
    int p;

    if (N <= 2)
    {
        return 2;
    }
    if (N <= 3)
    {
        return 3;
    }

//@s 先看 N 本身是不是素数（N 是偶数就先加一到奇数）
    p = (N % 2 != 0) ? N : N + 1;

//@s 往上找
//@d 上界要留足余量 —— 否则 p 一超界就直接返回非素数了。
    while (p <= MAXTABLESIZE)
    {
//@s 从 p/2 往下试除
        for (i = (int)(p / 2); i > 2; i--)
        {
            if (p % i == 0)
            {
                break;
            }
        }

//@s 除到 i == 2 都没找到因子，说明 p 是素数
        if (i == 2)
        {
            break;
        }

//@s 否则试下一个奇数
        p += 2;
    }

//@s 返回
    return p;
}
//@s 建一个空表
HashTable CreateTable(int TableSize)
{
//@s 表
    HashTable H;
//@s 循环用
    int i;

//@s 分配
    H = (HashTable)malloc(sizeof(struct TblNode));
//@s 表长取素数
    H->TableSize = NextPrime(TableSize);
//@s 分配格子
    H->Cells = (Cell *)malloc(H->TableSize * sizeof(Cell));

//@s 全部标成空
    for (i = 0; i < H->TableSize; i++)
    {
        H->Cells[i].Info = Empty;
        H->Cells[i].Data = 0;
    }

    return H;
}

//@s 释放
void DestroyTable(HashTable H)
{
    if (H == NULL)
    {
        return;
    }
    free(H->Cells);
    free(H);
}
//%end

//%module | 02 | Hash | Hash —— 散列函数与第二个散列函数 | 2 | 01 |
//%summary | 除留余数法；再给双散列准备一个"第二个散列函数"。
//@d ============ 双散列为什么需要第二个函数 ============
//@d
//@d 双散列的探测序列是：
//@d
//@d     h(k) + i × h₂(k)      i = 0, 1, 2, ...
//@d
//@d 关键要求：**h₂(k) 不能是 0**。
//@d
//@d 如果 h₂(k) = 0，那整条探测序列全是 h(k)，原地打转，永远找不到空位。
//@d
//@d 所以第二个散列函数要保证结果落在 [1, TableSize-1] 范围内。
//@d
//@d 常见做法是：
//@d
//@d     h₂(k) = R - (k % R)      其中 R 是小于表长的素数
//@d
//@d 因为 k % R 落在 [0, R-1]，所以 R - (k % R) 落在 [1, R] —— 一定不为 0。
//@d
//@d ============ 为什么双散列效果最好 ============
//@d
//@d 线性探测的步长永远是 1，平方探测的步长是 1, 4, 9...（固定序列），
//@d 而双散列的步长**依赖关键字本身**：
//@d
//@d   关键字不同的人，走的路子也不同 → 不容易互相干扰
//@d
//@d 所以双散列最接近"随机探测"的理想效果，冲突最少。
//@d 代价是要多算一个散列函数。

//@s 主散列函数：除留余数法
Index Hash(ElementType Key, int TableSize)
{
    return Key % TableSize;
}

//@s 第二个散列函数，用于双散列
//@d 保证返回值落在 [1, TableSize-1]，绝不会是 0。
Index Hash2(ElementType Key, int TableSize)
{
//@s 取一个比表长小的素数
    int R = NextPrime(TableSize / 2);

//@s R - (k % R) 落在 [1, R]
    return R - (Key % R);
}

//@s 算装填因子
double LoadFactor(HashTable H)
{
//@s 循环用
    int i;
//@s 已用格数（含墓碑）
    int used = 0;

    for (i = 0; i < H->TableSize; i++)
    {
        if (H->Cells[i].Info != Empty)
        {
            used++;
        }
    }
    return (double)used / H->TableSize;
}
//%end

//%module | 03 | FindLinear | FindLinear —— 线性探测 | 3 | 01,02 |
//%summary | 冲突了就试试下一格 —— 最简单，但会「扎堆」。
//@d ============ 线性探测的探测序列 ============
//@d
//@d     h(k), h(k)+1, h(k)+2, h(k)+3, ...
//@d
//@d 一格一格往后试，试到空位为止（越界就绕回表头）。
//@d
//@d 走一遍，表长 11，插入 20、31、42（都散列到 9）：
//@d
//@d   20 % 11 = 9  →  9 号空，放进去
//@d   31 % 11 = 9  →  9 号被占，试 10，空 → 放进去
//@d   42 % 11 = 9  →  9、10 都被占，试 0（绕回表头），空 → 放进去
//@d
//@d 结果：
//@d
//@d   下标:  0   1   2   3   4   5   6   7   8   9   10
//@d   值  : 42   -   -   -   -   -   -   -   -  20  31
//@d
//@d ============ 线性探测最大的问题：一次聚集 ============
//@d
//@d 看上例：20、31、42 本来只有 9 号格冲突，结果占了 9、10、0 三格。
//@d
//@d 现在如果有个新元素散列到 10 或 0，它就得继续往后试 ——
//@d **一个连续的块会越滚越大**。
//@d
//@d 这个现象叫**一次聚集（primary clustering）**：
//@d
//@d   一旦形成连续的占用块，任何散列到块内位置的元素都会被推得更远，
//@d   于是块继续变长 —— 恶性循环。
//@d
//@d 结果是：即使装填因子只有 0.5，平均探测次数也会明显高于理论值。
//@d
//@d ============ 为什么用它 ============
//@d
//@d 因为**顺序访问对 CPU 缓存极其友好**。
//@d
//@d 现代 CPU 读内存是按"缓存行"（64 字节）整块读的。
//@d 线性探测往后走的时候，后面几格很可能已经在缓存里了 —— 几乎不花额外代价。
//@d
//@d 所以虽然线性探测的理论探测次数最差，实测反而常常最快。
//@d 这也是为什么很多工业实现（比如 Python 的 dict）用它的变体。

//@s 线性探测查找：返回位置；没找到返回 -1
//@d 如果 Key 存在，返回它的位置；如果不存在，返回"第一个可以插入的位置"。
int FindLinear(HashTable H, ElementType Key, int *probes)
{
//@s 起始位置
    Index CurrentPos = Hash(Key, H->TableSize);
//@s 当前位置
    Index NewPos = CurrentPos;
//@s 已经试了几次
    int i = 0;

//@s 一步一步往后试
//@d 循环条件有两个：这格不是空的（说明还有希望找到），且这格的值不是要找的。
    while (H->Cells[NewPos].Info != Empty && H->Cells[NewPos].Data != Key)
    {
//@s 试下一格（越界就绕回表头）
        i++;
        NewPos = (CurrentPos + i) % H->TableSize;

//@s 走遍全表都没找到 → 表满或不存在
        if (i >= H->TableSize)
        {
            *probes = i;
            return NOTFOUND;
        }
    }

//@s 记下探测次数
    *probes = i + 1;

//@s 如果这一格有元素且值相等 → 找到了
    if (H->Cells[NewPos].Info == Legitimate && H->Cells[NewPos].Data == Key)
    {
        return NewPos;
    }

//@s 否则这格是空的（或墓碑）→ 说明 Key 不在表里，返回这个可插入的位置
    return NOTFOUND;
}
//%end

//%module | 04 | InsertLinear | InsertLinear —— 线性探测的插入 | 2 | 01,02,03 |
//%summary | 插入 = 先查找，找到空位就填进去。
//@d ============ 为什么插入能复用查找 ============
//@d
//@d 因为"找不到"和"该插哪儿"是同一件事：
//@d
//@d   查找时按探测序列往后走，走到 Empty 就停 —— 这时要么找到了，要么不存在
//@d   而这个停下来的空位，**正好就是插入该放的位置**
//@d
//@d 这两件事完全重合，所以很多教材干脆只写一个函数，
//@d 用"是否传入要插入的值"来区分查找和插入。
//@d
//@d 本课程分开写，是为了让两种操作的意图更清楚。
//@d
//@d ============ 墓碑可以复用 ============
//@d
//@d 插入时遇到 Deleted 的格子，可以直接占用它。
//@d
//@d 但要注意：**不能一遇到墓碑就插**，因为后面可能已经存在这个关键字了 ——
//@d 那样就插入了重复元素。
//@d
//@d 所以正确做法是记住"第一个遇到的墓碑位置"，继续往后找：
//@d
//@d   · 如果找到了相同关键字 → 说明已存在，什么都不做
//@d   · 如果遇到 Empty（说明肯定不存在）→ 插到**之前记的那个墓碑位置**
//@d
//@d 这个细节很容易漏。本模块为了简洁，采用"不处理重复插入"的简化版 ——
//@d 但你要知道正式实现该怎么做。

//@s 线性探测插入：成功返回插入位置，表满返回 -1
int InsertLinear(HashTable H, ElementType Key, int *probes)
{
//@s 起始位置
    Index CurrentPos = Hash(Key, H->TableSize);
//@s 当前位置
    Index NewPos = CurrentPos;
//@s 试了几次
    int i = 0;

//@s 找空位
//@d 一直往后试，直到遇到真正空的格子（墓碑也算可用）。
    while (H->Cells[NewPos].Info == Legitimate)
    {
//@s 已经存在就不重复插入
        if (H->Cells[NewPos].Data == Key)
        {
            *probes = i + 1;
            return NewPos;
        }

//@s 试下一格
        i++;
        NewPos = (CurrentPos + i) % H->TableSize;

//@s 绕了一整圈 → 表满
        if (i >= H->TableSize)
        {
            *probes = i;
            return NOTFOUND;
        }
    }

//@s 填进去
    H->Cells[NewPos].Data = Key;
    H->Cells[NewPos].Info = Legitimate;

//@s 记录探测次数
    *probes = i + 1;

//@s 返回位置
    return NewPos;
}

//@s 线性探测的删除：标成墓碑，不真的清空
//@d 直接标成 Empty 会把探测链断掉，后面的元素就找不到了。
Status DeleteLinear(HashTable H, ElementType Key)
{
//@s 探测次数（这里不关心，但还是得传个变量进去）
    int probes;
//@s 先找到它
    int pos = FindLinear(H, Key, &probes);

    if (pos < 0)
    {
        return ERROR;
    }

//@s 标成墓碑
    H->Cells[pos].Info = Deleted;

    return OK;
}
//%end

//%module | 05 | FindQuadratic | FindQuadratic —— 平方探测 | 3 | 01,02 |
//%summary | 步长改成 ±i²，缓解「扎堆」，但可能探测不到全表。
//@d ============ 平方探测的探测序列 ============
//@d
//@d     h(k) + 1², h(k) - 1², h(k) + 2², h(k) - 2², ...
//@d     也就是 h(k)±1, h(k)±4, h(k)±9, h(k)±16, ...
//@d
//@d 一左一右地跳，跳的幅度越来越大。
//@d
//@d 为什么这样能缓解聚集？
//@d
//@d 因为线性探测的问题在于"**散列到相近位置的元素会走同一条路**"。
//@d
//@d   20 % 11 = 9  →  试 10
//@d   31 % 11 = 9  →  试 10、0
//@d   42 % 11 = 9  →  试 10、0、1
//@d
//@d 它们全都沿着 9→10→0→1 走。而平方探测是 9→10→8→1→6……，
//@d **跳开了**，不容易形成连续的块。
//@d
//@d ============ 但它换来了一个新问题：二次聚集 ============
//@d
//@d **散列到同一个位置**的元素，探测序列仍然完全相同。
//@d
//@d 也就是说"同一起点"的元素依然会挤在一起。这个现象叫
//@d **二次聚集（secondary clustering）**。
//@d
//@d 比一次聚集好一些，但没根治 —— 根治要靠双散列。
//@d
//@d ============ 更要紧的问题：表长有讲究 ============
//@d
//@d 线性探测一定能走遍全表（因为它一格一格试）。
//@d **平方探测不一定。**
//@d
//@d 如果表长是合数，±i² 可能只覆盖到一半的格子，**有些位置永远试不到**。
//@d
//@d 教科书结论：**表长为形如 4k+3 的素数时，平方探测能覆盖全表。**
//@d
//@d 比如 7、11、19、23、31…… 都是 4k+3 形式的素数。
//@d （7 = 4×1+3，11 = 4×2+3，19 = 4×4+3）
//@d
//@d 所以用平方探测时，表长不能只取"任意素数"，还得满足这个条件。
//@d 这是个很容易被忽略的细节 —— 表长选错了，插入会"凭空失败"。

//@s 平方探测查找：返回位置；没找到返回 -1
int FindQuadratic(HashTable H, ElementType Key, int *probes)
{
//@s 起始位置
    Index CurrentPos = Hash(Key, H->TableSize);
//@s 当前位置
    Index NewPos = CurrentPos;
//@s 当前试探的步数
    int i = 0;
//@s 正负方向
    int sign = 1;
//@s 偏移量
    int offset;

    while (H->Cells[NewPos].Info != Empty && H->Cells[NewPos].Data != Key)
    {
//@s 步数加一
        i++;

//@s 奇数步往右、偶数步往左，幅度是 i² 的变化
//@d 具体偏移：i=1 时 +1，i=2 时 -1，i=3 时 +2²=+4…… 这里用简化写法：
//@d 偏移量 = sign × ((i + 1) / 2)²
        offset = ((i + 1) / 2) * ((i + 1) / 2) * sign;
        sign = -sign;

//@s 算出新位置并调整到合法范围
        NewPos = (CurrentPos + offset) % H->TableSize;
        while (NewPos < 0)
        {
            NewPos += H->TableSize;
        }

//@s 试得太多就放弃
        if (i >= H->TableSize)
        {
            *probes = i;
            return NOTFOUND;
        }
    }

//@s 探测次数
    *probes = i + 1;

//@s 找到了
    if (H->Cells[NewPos].Info == Legitimate && H->Cells[NewPos].Data == Key)
    {
        return NewPos;
    }

    return NOTFOUND;
}
//%end

//%module | 06 | FindDouble | FindDouble —— 双散列 | 3 | 01,02 |
//%summary | 步长由一个额外散列函数决定 —— 最接近"随机探测"。
//@d ============ 双散列的探测序列 ============
//@d
//@d     h(k) + i × h₂(k)        i = 0, 1, 2, ...
//@d
//@d 步长不是固定的 1（线性）也不是固定的 1,4,9（平方），
//@d 而是**由关键字自己算出来的 h₂(k)**。
//@d
//@d 举例：表长 11，h₂(k) = 7 - (k % 7)
//@d
//@d   关键字 20：h = 9，h₂ = 7 - (20%7) = 7 - 6 = 1
//@d             探测序列：9、10、0、1、2……
//@d   关键字 31：h = 9，h₂ = 7 - (31%7) = 7 - 3 = 4
//@d             探测序列：9、2、6、10、3……  ← 完全不同的路子
//@d
//@d 这就是关键：**散列到同一个起始位置的两个元素，走的序列也不同**。
//@d 所以既没有一次聚集、也没有二次聚集。
//@d
//@d ============ 代价 ============
//@d
//@d   ① 多算一次散列函数（多一次取模运算）
//@d   ② h₂(k) 必须保证不为 0，否则原地打转
//@d   ③ h₂(k) 最好与表长互质，这样序列才能覆盖全表
//@d
//@d 第三条的常见做法：**表长取素数，h₂(k) 的结果落在 [1, 表长-1]**。
//@d 因为素数表长与任何比它小的正整数都互质，序列必然能走遍全表。

//@s 双散列查找：返回位置；没找到返回 -1
int FindDouble(HashTable H, ElementType Key, int *probes)
{
//@s 起始位置
    Index CurrentPos = Hash(Key, H->TableSize);
//@s 当前位置
    Index NewPos = CurrentPos;
//@s 步长（由第二个散列函数决定）
    Index step = Hash2(Key, H->TableSize);
//@s 试了几次
    int i = 0;

    while (H->Cells[NewPos].Info != Empty && H->Cells[NewPos].Data != Key)
    {
//@s 走一步，步长是 step
        i++;
        NewPos = (CurrentPos + i * step) % H->TableSize;

//@s 试遍了就放弃
        if (i >= H->TableSize)
        {
            *probes = i;
            return NOTFOUND;
        }
    }

//@s 探测次数
    *probes = i + 1;

//@s 找到了
    if (H->Cells[NewPos].Info == Legitimate && H->Cells[NewPos].Data == Key)
    {
        return NewPos;
    }

    return NOTFOUND;
}
//%end

//%module | 07 | PrintTable | PrintTable —— 打印与统计 | 1 | 01,02 |
//@summary | 打印散列表、算平均探测次数。
//@d ============ 平均探测次数才是关键指标 ============
//@d
//@d 三种探测方式"能不能找到"都能做到。区别在于**要找几次**。
//@d
//@d 所以要统计"插入 n 个元素一共探测了多少次"，除以 n 得到平均值。
//@d 这个数越小，说明冲突越少、性能越好。
//@d
//@d 另一个要看的指标是**最大探测次数** —— 它反映"最坏情况有多糟"。
//@d 一次聚集严重的话，某个元素可能要试十几次。

//@s 打印散列表
void PrintTable(HashTable H)
{
//@s 循环用
    int i;

//@s 位数少的时候一行打得下
    printf("下标: ");
    for (i = 0; i < H->TableSize; i++)
    {
        printf("%4d", i);
    }
    printf("\n内容: ");
    for (i = 0; i < H->TableSize; i++)
    {
        if (H->Cells[i].Info == Legitimate)
        {
            printf("%4d", H->Cells[i].Data);
        }
        else if (H->Cells[i].Info == Deleted)
        {
            printf("%4s", "X");
        }
        else
        {
            printf("%4s", "-");
        }
    }
    printf("\n");
}
//%end

//%module | 08 | main | main —— 三种探测方式对比 | 3 | 01,02,03,04,05,06,07 |
//%summary | 同一批关键字，三种探测方式的探测次数差别很明显。
//@d ============ 怎么对比才公平 ============
//@d
//@d 要用**同一批关键字、同一个表长**，分别用三种方式插入，
//@d 然后比较总探测次数和最大探测次数。
//@d
//@d 为了把差别放大，这里故意挑一批**散列位置很集中**的关键字。
//@d 如果关键字本来就散得很开，三种方式都只用探测一次，看不出区别。

//@s 用指定方式插入一批关键字，返回总探测次数
//@d method: 1=线性 2=平方 3=双散列
int InsertBatch(HashTable H, const ElementType keys[], int n, int method, int *maxProbes)
{
//@s 循环用
    int i;
//@s 本次探测次数
    int probes;
//@s 总探测次数
    int total = 0;
//@s 起始位置和步长
    Index CurrentPos, NewPos, step;
//@s 试了几次
    int k;

//@s 最大探测次数
    *maxProbes = 0;

    for (i = 0; i < n; i++)
    {
//@s 算出起点
        CurrentPos = Hash(keys[i], H->TableSize);
        NewPos = CurrentPos;
        step = (method == 3) ? Hash2(keys[i], H->TableSize) : 1;
        k = 0;

//@s 找空位
        while (H->Cells[NewPos].Info == Legitimate)
        {
            k++;
            if (method == 1)
            {
                NewPos = (CurrentPos + k) % H->TableSize;
            }
            else if (method == 2)
            {
                int offset = ((k + 1) / 2) * ((k + 1) / 2) * ((k % 2) ? 1 : -1);
                NewPos = (CurrentPos + offset) % H->TableSize;
                while (NewPos < 0)
                {
                    NewPos += H->TableSize;
                }
            }
            else
            {
                NewPos = (CurrentPos + k * step) % H->TableSize;
            }

            if (k >= H->TableSize)
            {
                break;
            }
        }

//@s 填进去
        H->Cells[NewPos].Data = keys[i];
        H->Cells[NewPos].Info = Legitimate;

//@s 统计
        probes = k + 1;
        total += probes;
        if (probes > *maxProbes)
        {
            *maxProbes = probes;
        }
    }

    return total;
}

//@s 主函数
int main(void)
{
//@s 故意挑一批散列位置集中的关键字
//@d 表长 11 时，这些数对 11 取余分别是 9、9、9、9、9、9 —— 全撞在一起。
    static const ElementType keys[] = { 20, 31, 42, 53, 64, 75 };
//@s 个数
    int n = 6;
//@s 三个表
    HashTable H1, H2, H3;
//@s 循环用
    int i;
//@s 统计量
    int total1, total2, total3;
    int max1, max2, max3;
//@s 探测次数
    int probes;

//@s ===== 先看关键字散列到哪 =====
    printf("关键字: ");
    for (i = 0; i < n; i++)
    {
        printf("%d ", keys[i]);
    }
    printf("\n\n");

    printf("表长 = %d（素数）\n", NextPrime(9));
    printf("各关键字的散列位置：\n");
    for (i = 0; i < n; i++)
    {
        printf("  %d %% %d = %d", keys[i], NextPrime(9), Hash(keys[i], NextPrime(9)));
        if (i == 0)
        {
            printf("   ← 全都撞在这个位置！");
        }
        printf("\n");
    }
    printf("\n（这样能最大程度暴露三种探测方式的差别）\n\n");

//@s ===== 线性探测 =====
    H1 = CreateTable(9);
    total1 = InsertBatch(H1, keys, n, 1, &max1);
    printf("=== 线性探测 ===\n");
    PrintTable(H1);
    printf("  总探测 %d 次，平均 %.1f 次，最多 %d 次\n", total1, (double)total1 / n, max1);
    printf("  （会连成一片 —— 这就是「一次聚集」）\n\n");

//@s ===== 平方探测 =====
    H2 = CreateTable(9);
    total2 = InsertBatch(H2, keys, n, 2, &max2);
    printf("=== 平方探测 ===\n");
    PrintTable(H2);
    printf("  总探测 %d 次，平均 %.1f 次，最多 %d 次\n", total2, (double)total2 / n, max2);
    printf("  （跳开了连续块，但同起点的元素仍走同一条序列）\n\n");

//@s ===== 双散列 =====
    H3 = CreateTable(9);
    total3 = InsertBatch(H3, keys, n, 3, &max3);
    printf("=== 双散列 ===\n");
    PrintTable(H3);
    printf("  总探测 %d 次，平均 %.1f 次，最多 %d 次\n", total3, (double)total3 / n, max3);
    printf("  （步长由关键字决定，同起点的元素也走不同路子）\n\n");

//@s ===== 查找测试 =====
    printf("=== 查找测试（在线性探测的表里）===\n");
    for (i = 0; i < n; i++)
    {
        int pos = FindLinear(H1, keys[i], &probes);
        printf("  找 %d: 位置 %d，探测 %d 次\n", keys[i], pos, probes);
    }
    {
        int pos = FindLinear(H1, 999, &probes);
        printf("  找 999（不存在）: %s，探测 %d 次\n",
               pos < 0 ? "没找到" : "找到了", probes);
    }
    printf("\n");

//@s ===== 删除与墓碑 =====
    printf("=== 删除测试 ===\n");
    printf("删除 31: %s\n", DeleteLinear(H1, 31) == OK ? "成功" : "失败");
    PrintTable(H1);
    printf("（31 的位置变成 X —— 墓碑，不是 Empty）\n");
    printf("再找 42: ");
    {
        int pos = FindLinear(H1, 42, &probes);
        printf("位置 %d，探测 %d 次\n", pos, probes);
    }
    printf("（还能找到 —— 因为查找遇到墓碑会继续往后走）\n");
    printf("如果把 31 标成 Empty 而不是墓碑，42 就找不到了\n\n");

//@s ===== 装填因子的影响 =====
    printf("=== 装填因子的影响（理论值）===\n");
    printf("  线性探测平均探测次数约 (1 + 1/(1-α)) / 2\n");
    printf("  α=0.5 → 约 1.5 次\n");
    printf("  α=0.75 → 约 2.5 次\n");
    printf("  α=0.9 → 约 5.5 次  ← 迅速恶化\n\n");
    printf("所以开放地址法的表**不能装太满**，一般 α 到 0.75 就该扩容\n");

//@s 释放
    DestroyTable(H1);
    DestroyTable(H2);
    DestroyTable(H3);

//@s 正常结束
    return 0;
}
//%end
