/*
 * ============================================================================
 *  数据结构研习社 —— 06 散列 / 06-03 分离链接法
 * ============================================================================
 *
 *  上一节的开放地址法是"冲突了就另找一个空位"。
 *  分离链接法换了个办法：
 *
 *      **冲突了就挂在同一条链表上。**
 *
 *      下标:  0    1    2    3    4    5    6
 *            │    │    │    │    │    │    │
 *            ▼    ▼    ▼    ▼    ▼    ▼    ▼
 *           NULL [20] NULL [42] NULL [31] NULL
 *                 │         │         │
 *                [53]      [75]      [64]
 *
 *  数组的每格不再存"一个元素"，而是存"一条链表的头"。
 *
 *  ============ 和开放地址法的三个关键差别 ============
 *
 *  **① 不需要留空位**
 *     开放地址法必须空出格子给探测用，所以 α 不能接近 1。
 *     分离链接法的格子永远够用（链表可以一直挂），**装填因子可以大于 1**。
 *
 *  **② 删除很简单**
 *     开放地址法要留墓碑（否则探测链断掉）。
 *     分离链接法直接从链表里摘掉就行，**不需要墓碑**。
 *
 *  **③ 代价是指针和内存分配**
 *     每挂一个元素就要 malloc 一次，而且链表结点在内存里是散的，
 *     对 CPU 缓存不友好。开放地址法全在一个数组里，顺序访问很快。
 *
 *  ============ 怎么选 ============
 *
 *      元素数量能预估、在意缓存性能  →  开放地址法
 *      元素数量不确定、频繁删除      →  分离链接法
 *
 *  很多语言的字典实现是两者的混合（比如 Java 的 HashMap：
 *  链表短的时候用链表，链表长到一定程度转成红黑树）。
 *
 *  标记约定同前（本文件本身可编译）。
 * ============================================================================
 */

#include <stdio.h>
#include <stdlib.h>

//%module | 01 | typedef | 头文件与 typedef | 2 |
//%summary | 数组 + 链表：每格存一条链表的头。
//@d ============ "虚拟头结点"是什么 ============
//@d
//@d 数组的每一格本身就是一个 LNode，它的 Data 字段**不用**，
//@d 只用它的 Next 指针来挂真正的元素。
//@d
//@d 这个"不存数据的头"叫**虚拟头结点**（dummy head），好处是：
//@d
//@d   · 每个桶都天然非空，插入时不用特判"链表还空着"
//@d   · 删除时不用特判"删的是第一个结点"（因为第一个真正的元素永远不是头）
//@d
//@d 省掉一堆 if 判断，代码短很多。这是链表实现里非常常用的技巧。
//@d
//@d ============ 表长还要取素数吗 ============
//@d
//@d 还是要。虽然"分布均匀"的要求比开放地址法松一点，但取素数仍然有益。
//@d
//@d 不过有个细节差别：**分离链接法的装填因子可以大于 1**。
//@d
//@d   开放地址法：α 必须 < 1（否则没空位了）
//@d   分离链接法：α = 3 也行 —— 平均每条链表挂 3 个元素，查找就是走 3 步
//@d
//@d 所以分离链接法在"元素数远超表长"时依然能用，只是性能会线性下降。

//@s 元素类型
typedef int ElementType;

//@s 链表结点
typedef struct LNode *PtrToLNode;
struct LNode
{
//@s 存的关键字（头结点这个字段不用）
    ElementType Data;
//@s 下一个结点
    PtrToLNode Next;
};

//@s 位置（就是结点指针）
typedef PtrToLNode Position;
//@s 链表
typedef PtrToLNode List;

//@s 散列表
typedef struct TblNode *HashTable;
struct TblNode
{
//@s 表长（素数）
    int TableSize;
//@s 链表头数组
    List Heads;
};

//@s 状态码
#define OK 1
#define ERROR 0
typedef int Status;

//@s 表的最大容量
#define MAXTABLESIZE 20000

//@s 取不小于 N 的下一个素数
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

//@s 从 N 本身开始（N 是偶数就先加一到奇数）
    p = (N % 2 != 0) ? N : N + 1;

    while (p <= MAXTABLESIZE)
    {
        for (i = (int)(p / 2); i > 2; i--)
        {
            if (p % i == 0)
            {
                break;
            }
        }
        if (i == 2)
        {
            break;
        }
        p += 2;
    }
    return p;
}

//@s 建一个空表
HashTable CreateTable(int TableSize)
{
//@s 表
    HashTable H;
//@s 循环用
    int i;

//@s 分配表结构
    H = (HashTable)malloc(sizeof(struct TblNode));
//@s 表长取素数
    H->TableSize = NextPrime(TableSize);

//@s 分配链表头数组
    H->Heads = (List)malloc(H->TableSize * sizeof(struct LNode));

//@s 每格的 Data 不用，Next 置空
    for (i = 0; i < H->TableSize; i++)
    {
//@s 头结点的数据字段不用
        H->Heads[i].Data = 0;
//@s 链表先空着
        H->Heads[i].Next = NULL;
    }

    return H;
}

//@s 释放整张表
void DestroyTable(HashTable H)
{
//@s 循环用
    int i;
//@s 遍历指针和下一个
    Position P, tmp;

    if (H == NULL)
    {
        return;
    }

//@s 逐条链表释放
    for (i = 0; i < H->TableSize; i++)
    {
        P = H->Heads[i].Next;

        while (P != NULL)
        {
//@s 先记住下一个
            tmp = P->Next;
//@s 再释放当前
            free(P);
//@s 往后走
            P = tmp;
        }
    }

//@s 先 free 头数组
    free(H->Heads);
//@s 再 free 表结构
    free(H);
}
//%end

//%module | 02 | Hash | Hash —— 散列函数 | 2 | 01 |
//%summary | 还是除留余数法 —— 落到的那个格子，就是它要挂的链表。
//@d ============ 这里的散列函数作用变了 ============
//@d
//@d 开放地址法里，散列函数算出的位置是"起点"，冲突了还要往后探测。
//@d
//@d 分离链接法里，散列函数算出的位置就是**最终归属** ——
//@d 它决定了这个元素挂在哪条链表上，之后就不动了。
//@d
//@d 所以散列函数的质量对分离链接法的影响更直接：
//@d
//@d   散列函数好 → 各条链表长度差不多 → 查找走几步就够
//@d   散列函数差 → 有的链表长、有的空着 → 长的那些退化成线性查找
//@d
//@d 这也是为什么"分布均匀"永远是散列的第一要求。
//@d
//@d ============ 复杂度 ============
//@d
//@d 查找的代价是"遍历所在链表"，所以平均是 **O(1 + α)**，
//@d α 是装填因子（平均每条链表的长度）。
//@d
//@d 注意这里 α 可以大于 1。α = 3 意味着平均走 3 步 —— 还是常数级，
//@d 但比开放地址法那种"一次数组访问"慢。

//@s 除留余数法
int Hash(ElementType Key, int TableSize)
{
    return Key % TableSize;
}

//@s 算装填因子（对分离链接法来说就是"平均链表长度"）
//@d 注意这里统计的是**真正的元素个数**，不含头结点。
double LoadFactor(HashTable H)
{
//@s 循环用
    int i;
//@s 元素总数
    int count = 0;
//@s 遍历指针
    Position P;

    for (i = 0; i < H->TableSize; i++)
    {
        for (P = H->Heads[i].Next; P != NULL; P = P->Next)
        {
            count++;
        }
    }

    return (double)count / H->TableSize;
}
//%end

//%module | 03 | Find | Find —— 查找 | 2 | 01,02 |
//%summary | 先散列定位到某条链表，再顺着链表找。
//@d ============ 查找两步 ============
//@d
//@d   ① 用散列函数算出挂在哪条链表上
//@d   ② 顺着那条链表依次比较
//@d
//@d 第二步就是**普通的链表查找** —— 没有任何特别之处。
//@d
//@d 所以整个散列的复杂度分析可以拆开：
//@d
//@d   第一步 O(1)  +  第二步 O(链表长度)
//@d
//@d 而链表长度平均就是 α，所以总的是 O(1 + α)。
//@d
//@d ============ 为什么要返回"位置"而不是"找到了吗" ============
//@d
//@d 因为后面的删除要用到它 —— 知道结点在哪，才能从链表上摘下来。
//@d
//@d 返回 NULL 表示没找到。这个约定让查找、删除能共用同一个函数。
//@d
//@d ============ 和开放地址法的一个细微差别 ============
//@d
//@d 开放地址法的查找**必须区分"没找到"和"表满了"** —— 因为探测可能走遍全表。
//@d
//@d 分离链接法没这个问题：链表走到 NULL 就是没找到，干净利落。
//@d 这也是它的一个隐性优势：**逻辑更简单，不容易出边界 bug**。

//@s 查找 Key，返回结点位置；没找到返回 NULL
Position Find(HashTable H, ElementType Key)
{
//@s 遍历指针
    Position P;
//@s 这个键该挂在哪条链表上
    int pos = Hash(Key, H->TableSize);

//@s 从虚拟头结点的下一个开始
    P = H->Heads[pos].Next;

//@s 顺着链表找
//@d 两个终止条件：走到尾（没找到）、或者找到了。
    while (P != NULL && P->Data != Key)
    {
        P = P->Next;
    }

//@s 返回 P（找到就是结点，没找到就是 NULL）
    return P;
}
//%end

//%module | 04 | Insert | Insert —— 插入 | 3 | 01,02,03 |
//%summary | 先查重，再头插。
//@d ============ 插入两步 ============
//@d
//@d   ① 先查找，看这个键是不是已经存在（存在就不重复插入）
//@d   ② 不存在 → 造一个新结点，**头插**到对应链表上
//@d
//@d ============ 为什么用头插 ============
//@d
//@d 和邻接表一样：头插 O(1)，不用找尾，而且链表里的顺序本来就不重要。
//@d
//@d 但要注意一个后果：**同一条链表里的顺序和插入顺序相反**。
//@d
//@d 如果题目要求"按插入顺序输出同一条链上的元素"，就得改成尾插（多一个尾指针）
//@d 或者插完再反转。
//@d
//@d ============ 一个常被忽略的设计问题 ============
//@d
//@d 散列表里到底允不允许**重复关键字**？
//@d
//@d   · 作为"集合"用（比如去重）→ 不允许，插入前要查重
//@d   · 作为"多重集"用（比如统计词频）→ 允许，或者结点里加一个计数字段
//@d
//@d 本实现选择"不允许重复"，所以插入前先 Find 一次。
//@d 代价是每次插入多走一次链表 —— 想省这点开销也可以不查重（取决于需求）。
//@d
//@d Java 的 HashMap 采用"键相同就覆盖值"，也是一种处理方式。

//@s 插入 Key；已存在则什么都不做
//@d 返回插入位置（存在时返回已有结点）
Position Insert(HashTable H, ElementType Key)
{
//@s 新结点
    Position NewNode;
//@s 已有的结点
    Position P;
//@s 该挂在哪条链上
    int pos;

//@s ① 先查重
    P = Find(H, Key);
    if (P != NULL)
    {
//@s 已经存在，直接返回
        return P;
    }

//@s ② 造新结点
    NewNode = (Position)malloc(sizeof(struct LNode));
    if (NewNode == NULL)
    {
        printf("内存分配失败\n");
        exit(1);
    }
    NewNode->Data = Key;

//@s 算出该挂哪条链
    pos = Hash(Key, H->TableSize);

//@s ③ 头插到那条链上
//@d 新结点的 Next 指向原来的第一个，头结点的 Next 指向新结点。
    NewNode->Next = H->Heads[pos].Next;
    H->Heads[pos].Next = NewNode;

//@s 返回新结点
    return NewNode;
}
//%end

//%module | 05 | Delete | Delete —— 删除 | 3 | 01,02,03 |
//%summary | 从链表上摘掉结点，然后 free —— 干净利落，不留痕迹。
//@d ============ 为什么不需要墓碑 ============
//@d
//@d 开放地址法里，元素之间的"探测链"是靠数组位置串起来的，
//@d 删掉中间一个就会把链断掉 —— 所以只能标墓碑。
//@d
//@d 分离链接法里，元素之间的连接是**链表指针**。
//@d 从链表上摘掉一个结点，剩下的结点之间的指针依然连着，**什么都没断**。
//@d
//@d 所以直接 free 掉就行。这是分离链接法一个很实在的优势。
//@d
//@d ============ 链表删除的标准三步 ============
//@d
//@d   ① 找到待删结点的**前一个**（这样才能改它的 Next）
//@d   ② 前一个的 Next 指向待删结点的 Next（把它"绕过"）
//@d   ③ free 掉待删结点
//@d
//@d 第 ① 步是关键：单向链表里你没法从当前结点回到前一个，
//@d 所以**删除操作必须从头开始找前驱**，不能只拿到当前结点指针。
//@d
//@d （用双向链表可以避免，但散列没必要为此付出额外空间。）
//@d
//@d 有了虚拟头结点，第 ① 步会简单很多：
//@d 直接从虚拟头结点开始，前驱初始就是它 —— 不用特判"删的是第一个元素"。

Status Delete(HashTable H, ElementType Key)
{
//@s 前驱结点（从虚拟头开始）
    Position Prev;
//@s 当前结点
    Position P;
//@s 该在哪条链上
    int pos;

//@s 算出链表位置
    pos = Hash(Key, H->TableSize);

//@s 从虚拟头结点开始
//@d 因为头结点有 Next 字段，删除第一个真元素时不用特判。
    Prev = &H->Heads[pos];
    P = Prev->Next;

//@s 找待删结点
    while (P != NULL && P->Data != Key)
    {
//@s 前驱和当前一起往后走
        Prev = P;
        P = P->Next;
    }

//@s 走到尾都没找到
    if (P == NULL)
    {
        return ERROR;
    }

//@s 把它从链上绕过
    Prev->Next = P->Next;

//@s 释放
    free(P);

//@s 成功
    return OK;
}
//%end

//%module | 06 | PrintTable | PrintTable —— 打印与分布统计 | 1 | 01,02 |
//%summary | 打印每条链表，统计长度分布。
//@d ============ 为什么专门统计"链表长度分布" ============
//@d
//@d 因为对分离链接法来说，**性能直接由最长的链表决定**。
//@d
//@d   平均长度 2，但最长 20 → 那 20 个元素的查找都是 O(20)
//@d
//@d 所以光看平均装填因子不够，还要看**最长链表有多长**。
//@d
//@d 理想情况下，n 个元素散到 m 个桶里，最长链表大约 O(log n / log log n)
//@d —— 这是"球放入桶"问题的经典结论，虽然理论上可能很长，实践中很少发生。
//@d
//@d 但**如果散列函数有缺陷**，最长链表可能长得多。所以这个统计很有诊断价值。
//@d
//@d Java 8 给 HashMap 加的那条规则就是这个思路的极致：
//@d **链表长度超过 8 就转成红黑树**，把最坏情况从 O(n) 降到 O(log n)。

//@s 打印散列表的每一条链表
void PrintTable(HashTable H)
{
//@s 循环用
    int i;
//@s 遍历指针
    Position P;

    for (i = 0; i < H->TableSize; i++)
    {
        printf("  [%2d] ", i);
        P = H->Heads[i].Next;

//@s 链表空着
        if (P == NULL)
        {
            printf("(空)");
        }

//@s 打印链表上的元素
        while (P != NULL)
        {
            printf("%d", P->Data);
            if (P->Next != NULL)
            {
                printf(" → ");
            }
            P = P->Next;
        }
        printf("\n");
    }
}

//@s 统计链表长度的分布
void PrintStats(HashTable H)
{
//@s 循环用
    int i;
//@s 遍历指针
    Position P;
//@s 当前链表长度
    int len;
//@s 最长链表
    int maxLen = 0;
//@s 空链表的条数
    int empty = 0;
//@s 元素总数
    int total = 0;
//@s 长度分布的计数（长度 0~9）
    int dist[10];

//@s 清零
    for (i = 0; i < 10; i++)
    {
        dist[i] = 0;
    }

//@s 逐条统计
    for (i = 0; i < H->TableSize; i++)
    {
        len = 0;
        for (P = H->Heads[i].Next; P != NULL; P = P->Next)
        {
            len++;
        }

        total += len;
        if (len > maxLen)
        {
            maxLen = len;
        }
        if (len == 0)
        {
            empty++;
        }
        if (len < 10)
        {
            dist[len]++;
        }
    }

//@s 输出
    printf("  表长 = %d，元素 = %d，装填因子 = %.2f\n",
           H->TableSize, total, (double)total / H->TableSize);
    printf("  空链表 %d 条，最长链表 %d 个元素\n", empty, maxLen);
    printf("  长度分布（长度:条数）: ");
    for (i = 0; i < 10; i++)
    {
        if (dist[i] > 0)
        {
            printf("%d:%d  ", i, dist[i]);
        }
    }
    printf("\n");
    printf("  （最长链表决定最坏情况的查找代价 —— 它比平均值更值得关注）\n");
}
//%end

//%module | 07 | main | main —— 分离链接法跑一遍 | 3 | 01,02,03,04,05,06 |
//%summary | 插入、查找、删除，并和开放地址法对比。
//@d ============ 这个例子的看点 ============
//@d
//@d 用一批"散列位置集中"的关键字（都能被 11 整除），这样链表会长起来，
//@d 能看清"同一条链上的元素"和"头插导致的逆序"。
//@d
//@d 另外要看两件事：
//@d
//@d   ① 装填因子可以大于 1（这里放 12 个元素、表长 11）
//@d   ② 删除**不需要墓碑**，直接从链表摘掉

//@s 主函数
int main(void)
{
//@s 一批都会散列到 0 号桶的关键字
//@d 11、22、33、44、55、66 都能被 11 整除，余数全是 0。
    static const ElementType keys[] = { 11, 22, 33, 44, 55, 66, 77, 88 };
//@s 另外几个散到别处的
    static const ElementType others[] = { 5, 16, 27, 38 };
//@s 个数
    int n = 8;
    int m = 4;
//@s 表
    HashTable H;
//@s 循环用
    int i;
//@s 查找结果
    Position P;

//@s 建表
    H = CreateTable(11);

    printf("表长 = %d（素数）\n", H->TableSize);
    printf("插入 8 个都能被 11 整除的关键字 → 它们会挂在同一条链上\n\n");

//@s 插入
    for (i = 0; i < n; i++)
    {
        Insert(H, keys[i]);
    }
    for (i = 0; i < m; i++)
    {
        Insert(H, others[i]);
    }

//@s 打印
    printf("=== 表的内容 ===\n");
    PrintTable(H);

//@s 统计
    printf("\n=== 统计 ===\n");
    PrintStats(H);
    printf("\n注意 [0] 号桶挂了 %d 个元素（都是 11 的倍数）\n", n);
    printf("（这就是「散列函数选得差」的后果 —— 分布严重不均）\n\n");

//@s 查找
    printf("=== 查找 ===\n");
    for (i = 0; i < 3; i++)
    {
        P = Find(H, others[i]);
        printf("  找 %d: %s\n", others[i], P ? "找到了" : "没找到");
    }
    P = Find(H, keys[0]);
    printf("  找 %d: %s\n", keys[0], P ? "找到了" : "没找到");
    P = Find(H, 999);
    printf("  找 999（不存在）: %s\n", P ? "找到了" : "没找到");

//@s 注意头插的顺序
    printf("\n=== 头插的后果 ===\n");
    printf("  插入顺序: ");
    for (i = 0; i < 5; i++)
    {
        printf("%d ", keys[i]);
    }
    printf("\n");

//@s 打印 0 号桶
    {
        int pos = Hash(keys[0], H->TableSize);
        printf("  [%d] 号桶实际顺序: ", pos);
        for (P = H->Heads[pos].Next; P != NULL; P = P->Next)
        {
            printf("%d ", P->Data);
        }
        printf("\n  （和插入顺序**相反** —— 因为用的是头插）\n");
    }

//@s 删除
    printf("\n=== 删除 ===\n");
    printf("  删除 33: %s\n", Delete(H, 33) == OK ? "成功" : "失败");
    printf("  删除 999（不存在）: %s\n", Delete(H, 999) == OK ? "成功" : "失败");
    printf("  删除之后再找 33: %s\n", Find(H, 33) ? "还在" : "确实没了");

    printf("\n  [0] 号桶现在是: ");
    {
        int pos = Hash(keys[0], H->TableSize);
        for (P = H->Heads[pos].Next; P != NULL; P = P->Next)
        {
            printf("%d ", P->Data);
        }
    }
    printf("\n  （直接从链表摘掉了 —— **不需要墓碑**）\n");

//@s 对比
    printf("\n=== 和开放地址法对比 ===\n");
    printf("  分离链接法：\n");
    printf("    · 装填因子可以大于 1（这里 %d 个元素 / %d 个桶）\n", n + m, H->TableSize);
    printf("    · 删除简单，不需要墓碑\n");
    printf("    · 代价：每个元素要 malloc，链表结点在内存里是散的\n");
    printf("\n  开放地址法：\n");
    printf("    · 装填因子必须 < 1，到 0.75 就该扩容\n");
    printf("    · 删除要留墓碑\n");
    printf("    · 优势：全在一个数组里，顺序访问对 CPU 缓存友好\n");
    printf("\n  所以：元素数能预估、在意缓存性能 → 开放地址法\n");
    printf("        元素数不确定、频繁删除       → 分离链接法\n");

//@s 释放
    DestroyTable(H);
    printf("\n表已释放（逐条链表释放结点，再 free 头数组，最后 free 表结构）\n");

//@s 结课
    printf("\n===== 到这里，陈越《数据结构》的六章内容全部讲完了 =====\n");

//@s 正常结束
    return 0;
}
//%end
