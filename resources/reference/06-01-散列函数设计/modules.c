/*
 * ============================================================================
 *  数据结构研习社 —— 06 散列 / 06-01 散列函数设计
 * ============================================================================
 *
 *  前面所有的查找结构——顺序表、二叉搜索树、AVL、堆——都在做同一件事：
 *  **把数据排好序，然后利用顺序加速查找。**
 *
 *  散列（哈希）换了个思路：**我不排了，我直接算出你在哪。**
 *
 *      查找 n 个数据   顺序查找 O(n)   有序数组/AVL O(log n)
 *      散列            **O(1)** —— 平均情况下
 *
 *  怎么做到？把关键字通过一个**散列函数**映射成数组下标：
 *
 *      关键字          散列函数         下标
 *        25     ──→   h(k) = k % 13   ──→   12
 *
 *  理想情况下这个映射是一一对应的，查的时候算一下就能直接跳到那一格。
 *
 *  ============ 但现实有两个问题 ============
 *
 *  **① 冲突不可避免**：不同的关键字可能算出同一个下标。
 *     比如 25 和 38 对 13 取余都是 12。
 *
 *     （想彻底避免冲突，除非表长 >= 关键字取值范围 —— 那就退化成
 *       直接用数组下标存了，不叫散列。）
 *
 *  **② 散列函数选得好不好，直接决定冲突多不多**。
 *     散列函数是这一节的主题；怎么处理冲突是接下来两节的主题。
 *
 *  标记约定同前（本文件本身可编译）。
 * ============================================================================
 */

#include <stdio.h>
#include <stdlib.h>
#include <string.h>

//%module | 01 | typedef | 头文件与 typedef | 2 |
//%summary | 散列表就是一个数组，每格带一个「状态」标记。
//@d ============ 为什么要"状态"而不只是"值" ============
//@d
//@d 数组里每格有三种可能：
//@d
//@d   Empty      从来没放过东西
//@d   Legitimate 这里有一个有效元素
//@d   Deleted    这里曾经有元素，被删掉了
//@d
//@d **为什么要单独区分 Empty 和 Deleted？**
//@d
//@d 因为线性探测的查找过程是"从散列位置往后一格一格找，**遇到 Empty 就停**"。
//@d
//@d 如果把删除的格子标成 Empty：
//@d
//@d   插入 25、38、51（假设都散列到同一格），它们会依次占据 12、13、14
//@d   现在删掉 38（下标 13），把它标成 Empty
//@d   再查 51：从 12 开始，往后走 —— 到 13 发现是 Empty，**以为后面没有了**，
//@d              于是报告"51 不存在" ✗  但它明明在 14！
//@d
//@d 所以删除的格子必须留个"墓碑"（Deleted）：
//@d 查找时**遇到它要继续往后走**，插入时可以把它当作空位复用。
//@d
//@d 这是散列里一个非常经典、也非常容易被忽略的坑。
//@d
//@d ============ 表长为什么取素数 ============
//@d
//@d 用"除留余数法"（k % TableSize）时，**表长取素数能让分布更均匀**。
//@d
//@d 举个反例：表长取 10（合数），关键字是"所有偶数"。
//@d
//@d   k % 10 的结果只可能是 0、2、4、6、8 —— **奇数格子全空着**
//@d
//@d 如果表长取 11（素数），偶数的余数就能落到所有 11 个格子上。
//@d
//@d 直观理解：素数和大多数数都"互质"，不会出现"只能落在某些格子上"的限制。

//@s 元素类型（关键字）
typedef int ElementType;

//@s 下标类型
typedef int Index;

//@s 散列表的最大容量
#define MAXTABLESIZE 20000

//@s 每格的状态
typedef enum
{
//@s 从没放过东西
    Empty,
//@s 有一个有效元素
    Legitimate,
//@s 被删除了（墓碑）
    Deleted
} EntryType;

//@s 一个格子
typedef struct HashEntry Cell;
struct HashEntry
{
//@s 存的关键字
    ElementType Data;
//@s 这个格子的状态
    EntryType Info;
};

//@s 散列表
typedef struct TblNode *HashTable;
struct TblNode
{
//@s 表长
    int TableSize;
//@s 格子数组
    Cell *Cells;
};

//@s 状态码
#define OK 1
#define ERROR 0
typedef int Status;

//@s 表示"没找到"的特殊值
#define NOTFOUND (-1)

//@s 释放散列表
void DestroyTable(HashTable H)
{
//@s 空指针不管
    if (H == NULL)
    {
        return;
    }
//@s 先放格子数组
    free(H->Cells);
//@s 再放表结构
    free(H);
}
//%end

//%module | 02 | NextPrime | NextPrime —— 找一个素数当表长 | 2 | 01 |
//%summary | 从 N 往上找第一个素数，用来当表长。
//@d ============ 为什么表长要取素数 ============
//@d
//@d 因为最常用的散列函数是"除留余数法" `k % TableSize`。
//@d
//@d 如果表长是合数，就存在"只能落在部分格子"的问题。
//@d
//@d   表长 10，关键字都是偶数 → 只能落在 0 2 4 6 8，一半的格子永远空着
//@d   表长 12，关键字都是 3 的倍数 → 只能落在 0 3 6 9
//@d
//@d 换成素数就没这个问题：素数和大多数数互质，余数能均匀铺开。
//@d
//@d ============ 怎么高效地找素数 ============
//@d
//@d 试除法：对 p 检查有没有 2 到 √p 之间的因子。
//@d
//@d 两个小优化：
//@d
//@d   · 从 √p 往下试（因为因子成对出现，试到 √p 就够了）
//@d   · **只试奇数**：偶数除了 2 都不是素数，所以从 N 往上时直接跳到奇数
//@d
//@d 第二个优化很实用：光跳过偶数就省了一半检查。
//@d
//@d 复杂度上，试除是 O(√p)，而素数之间的平均间隔是 O(log p)，
//@d 所以找下一个素数的开销可以接受 —— 而且它只在建表时做一次。

//@s 取不小于 N 的下一个素数（和 06-02、06-03 那份实现一样）
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
//%end

//%module | 03 | HashMod | HashMod —— 除留余数法 | 3 | 01,02 |
//%summary | 最常用的散列函数：关键字直接对表长取余。
//@d ============ 为什么它最常用 ============
//@d
//@d   ① **计算极快**：一次取余运算
//@d   ② **结果一定在 [0, TableSize) 范围内**：天然就是合法下标
//@d   ③ 只要表长选得好（素数），分布就很均匀
//@d
//@d 这三条让它成了绝大多数实现的选择。
//@d
//@d ============ 它适用于什么样的关键字 ============
//@d
//@d **随机性比较好**的关键字。
//@d
//@d 比如学号、身份证后几位、随机生成的 ID —— 取余之后分布很均匀。
//@d
//@d 但如果关键字有"规律"，效果就差：
//@d
//@d   全是 10 的倍数（100, 200, 300……）而表长取 10
//@d   → 余数全是 0，**全挤在一格**
//@d
//@d 所以这种情况要先"打散"一下再取余（比如先平方取中、或者乘一个常数）。

//@s 除留余数法
Index HashMod(ElementType Key, int TableSize)
{
//@s 直接取余
    return Key % TableSize;
}

//@s 带打散的除留余数法（用于有规律的关键字）
//@d 先乘一个与表长互质的常数、再取余，能明显改善分布。
Index HashModScramble(ElementType Key, int TableSize)
{
//@s 乘一个奇数再取余
//@d 乘法定理：只要乘数与表长互质，就能保证映射是一一对应的。
    return (Key * 31) % TableSize;
}
//%end

//%module | 04 | HashFold | HashFold —— 折叠法与平方取中法 | 2 | 01 |
//%summary | 关键字太长或太有规律时，先用别的办法打散。
//@d ============ 折叠法（Folding） ============
//@d
//@d 适用于**关键字位数很多**的情况，比如一个 12 位身份证号。
//@d
//@d 做法：把关键字按位数切段，各段**相加**，再对表长取余。
//@d
//@d 举例，关键字 123456789，表长 1000，每段 3 位：
//@d
//@d   123 + 456 + 789 = 1368
//@d   1368 % 1000 = 368
//@d
//@d 好处是**每一段的信息都用上了**。如果直接对 123456789 取余，
//@d 只有低位参与运算，高位的差异全丢了。
//@d
//@d 还有一种是"**移位折叠**"：奇数段正着加、偶数段倒着加 ——
//@d 比直接相加更能打散。
//@d
//@d ============ 平方取中法（Mid-Square） ============
//@d
//@d 做法：先把关键字**平方**，然后取中间几位。
//@d
//@d 举例，关键字 1234，表长 1000：
//@d
//@d   1234² = 1522756
//@d   取中间 3 位 → 227（或者 522，看从哪儿开始取）
//@d
//@d 为什么有效？因为**平方之后，原数的每一位都会影响结果的中间位**。
//@d 这正好弥补了"除留余数法只看低位"的缺点。
//@d
//@d 教材上经典的一句话：**"平方取中法对每一位数字都有影响，
//@d 所以得到的散列地址比较均匀。"**

//@s 折叠法：按每段 width 位切开，相加后取余
Index HashFold(long long Key, int TableSize, int width)
{
//@s 累加结果
    long long sum = 0;
//@s 每一段
    long long part;
//@s 10^width，用来切段
    long long base = 1;
//@s 循环用
    int i;

//@s 先算出 10^width
    for (i = 0; i < width; i++)
    {
        base *= 10;
    }

//@s 一段一段切，切完就累加
    while (Key > 0)
    {
//@s 取出最低的 width 位
        part = Key % base;
//@s 剩下的部分留到下一轮
        Key /= base;
//@s 累加这一段
        sum += part;
    }

//@s 对表长取余
    return (Index)(sum % TableSize);
}

//@s 平方取中法：先平方，再取中间的 digits 位
Index HashMidSquare(long long Key, int TableSize, int digits)
{
//@s 平方
    long long sq = Key * Key;
//@s 用来取中间位的除数
    long long base = 1;
//@s 循环用
    int i;

//@s 算出 10^digits
    for (i = 0; i < digits; i++)
    {
        base *= 10;
    }

//@s 先去掉低位的一些位（取中而非取低）
//@d 这里简化为"去掉最低的 digits/2 位，再取 digits 位"。
    sq /= 10;
    sq = sq % base;

//@s 最后对表长取余
    return (Index)(sq % TableSize);
}
//%end

//%module | 05 | HashString | HashString —— 字符串散列 | 3 | 01 |
//%summary | 字符串怎么变成一个下标 —— 移位相加法。
//@d ============ 为什么字符串需要特殊处理 ============
//@d
//@d 整数可以直接取余，但字符串不行。最直接的想法是"把每个字符的 ASCII 码加起来"：
//@d
//@d     h = 0;
//@d     while (*Key) h += *Key++;
//@d     return h % TableSize;
//@d
//@d 这个办法能用，但**分布很差**。因为加法**满足交换律**：
//@d
//@d     "abc" 和 "cba" 的 ASCII 和完全相同 → 散列到同一格
//@d     "abc" 和 "acb" 也是
//@d
//@d 单词里字母的排列组合很多，但"和"相同的却不少 —— 冲突会明显偏多。
//@d
//@d ============ 移位相加法 ============
//@d
//@d 改良办法是每次**先左移几位再加**：
//@d
//@d     h = (h << 5) + *Key++;
//@d
//@d 左移 5 位等于乘以 32。这样一来顺序就重要了：
//@d
//@d     "abc" → ((0*32 + 97)*32 + 98)*32 + 99
//@d     "cba" → ((0*32 + 99)*32 + 98)*32 + 97
//@d
//@d 两者显然不同了。
//@d
//@d 这就是 **Horner 法则**（也就是"秦九韶算法"）—— 把字符串看成
//@d 一个 32 进制的数，从高位到低位逐位累积。
//@d
//@d ============ 几个实用细节 ============
//@d
//@d ① **用 unsigned int 而不是 int**：左移和累加会很快溢出，
//@d    无符号数的溢出是"回绕"，行为有定义；有符号数溢出是未定义行为。
//@d
//@d ② 乘数取 31 或 32 是经验值。乘 31 有个额外好处：
//@d    编译器能优化成 `(h << 5) - h`，比真的乘法快。
//@d    （Java 的 String.hashCode 用的就是 31。）
//@d
//@d ③ 表长仍然应该取素数，配合取余的效果最好。

//@s 字符串散列：移位相加法
//@d 乘数是 32（左移 5 位），累积成"32 进制数"。
Index HashString(const char *Key, int TableSize)
{
//@s 用无符号数，溢出行为有定义
    unsigned int h = 0;

//@s 逐字符累积
//@d h = h * 32 + c —— 每一步都把之前所有字符的影响保留下来。
    while (*Key != '\0')
    {
        h = (h << 5) + (unsigned char)(*Key);
        Key++;
    }

//@s 对表长取余
    return (Index)(h % (unsigned int)TableSize);
}

//@s 对比用：最简单的"ASCII 求和"散列
//@d 分布差，但能直观看出"交换律"带来的问题。
Index HashStringBad(const char *Key, int TableSize)
{
//@s 累加
    unsigned int h = 0;

    while (*Key != '\0')
    {
        h += (unsigned char)(*Key);
        Key++;
    }

    return (Index)(h % (unsigned int)TableSize);
}
//%end

//%module | 06 | PrintHash | PrintHash —— 打印与统计 | 1 | 01 |
//%summary | 打印散列表、统计分布均匀程度。
//@d ============ 怎么判断"散列函数好不好" ============
//@d
//@d 一个直观的指标：**看各个格子被用到的次数是否均匀**。
//@d
//@d 好的散列函数：每个格子被用到的次数差不多。
//@d 差的散列函数：有的格子挤爆、有的格子永远空着。
//@d
//@d 另一种更定量的说法是"**冲突次数**"：
//@d n 个关键字散列到 m 个格子，理想的冲突次数接近 n²/(2m)。
//@d 实际冲突数比这个明显大，就说明散列函数有问题。

//@s 打印散列表的内容
void PrintTable(HashTable H)
{
//@s 循环用
    int i;

    printf("下标: ");
    for (i = 0; i < H->TableSize; i++)
    {
        printf("%4d", i);
    }
    printf("\n");

    printf("内容: ");
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

//@s 统计每种状态各有多少格
void PrintStats(HashTable H)
{
//@s 循环用
    int i;
//@s 三种计数
    int empty = 0;
    int used = 0;
    int deleted = 0;

    for (i = 0; i < H->TableSize; i++)
    {
        if (H->Cells[i].Info == Empty)
        {
            empty++;
        }
        else if (H->Cells[i].Info == Legitimate)
        {
            used++;
        }
        else
        {
            deleted++;
        }
    }

    printf("  空 %d 格，有元素 %d 格，墓碑 %d 格\n", empty, used, deleted);
    printf("  装填因子 = %d / %d = %.2f\n", used + deleted, H->TableSize,
           (double)(used + deleted) / H->TableSize);
}
//%end

//%module | 07 | main | main —— 几种散列函数对比 | 3 | 01,02,03,04,05,06 |
//%summary | 同一批关键字，几种散列函数的分布差别很明显。
//@d ============ 怎么看出差别 ============
//@d
//@d 关键是准备一批**有规律的关键字**，让"差的散列函数"暴露问题。
//@d
//@d 比如"全是 10 的倍数"这类数据：
//@d
//@d   直接取余（表长 10）→ 全挤在 0 号格
//@d   先乘 31 再取余       → 均匀铺开
//@d
//@d 字符串也一样："abc" 和 "cba" 在"求和法"下会撞车，在"移位法"下不会。

//@s 主函数
int main(void)
{
//@s 表长：从 10 开始找素数
    int size;
//@s 循环用
    int i;
//@s 一组"有规律"的关键字：全是 10 的倍数
    ElementType keys[] = { 100, 200, 300, 400, 500, 600, 700, 800 };
//@s 关键字个数
    int n = 8;
//@s 统计每个格子被用到几次
    int hits[64];
//@s 冲突次数
    int conflict;

//@s ===== 表长的选择 =====
    printf("=== 表长取素数 ===\n");
    printf("要求表长不小于 10：\n");
    for (i = 10; i <= 14; i++)
    {
        printf("  NextPrime(%d) = %d\n", i, NextPrime(i));
    }
    size = NextPrime(10);
    printf("（素数做表长，除留余数法的分布才均匀）\n\n");

//@s ===== 对比两种散列函数 =====
    printf("=== 关键字都是 10 的倍数：100, 200, ..., 800 ===\n\n");

//@s 第一种：直接取余
    printf("--- HashMod（直接取余 k %% %d）---\n", size);
    for (i = 0; i < size; i++)
    {
        hits[i] = 0;
    }
    conflict = 0;
    for (i = 0; i < n; i++)
    {
        Index h = HashMod(keys[i], size);
        if (hits[h] > 0)
        {
            conflict++;
        }
        hits[h]++;
    }
    printf("  散列结果: ");
    for (i = 0; i < n; i++)
    {
        printf("%d→%d  ", keys[i], HashMod(keys[i], size));
    }
    printf("\n");
    printf("  冲突次数: %d\n", conflict);
    printf("  分布: ");
    for (i = 0; i < size; i++)
    {
        printf("%d ", hits[i]);
    }
    printf("\n");
    printf("  （关键字全是 100 的倍数，%d = 1×100，所以余数都有规律）\n\n", size);

//@s 第二种：先乘 31 再取余
    printf("--- HashModScramble（先乘 31 再取余）---\n");
    for (i = 0; i < size; i++)
    {
        hits[i] = 0;
    }
    conflict = 0;
    for (i = 0; i < n; i++)
    {
        Index h = HashModScramble(keys[i], size);
        if (hits[h] > 0)
        {
            conflict++;
        }
        hits[h]++;
    }
    printf("  散列结果: ");
    for (i = 0; i < n; i++)
    {
        printf("%d→%d  ", keys[i], HashModScramble(keys[i], size));
    }
    printf("\n");
    printf("  冲突次数: %d\n", conflict);
    printf("  分布: ");
    for (i = 0; i < size; i++)
    {
        printf("%d ", hits[i]);
    }
    printf("\n");
    printf("  （乘 31 把规律打散了，分布明显更均匀）\n\n");

//@s ===== 长整数：折叠法 =====
    printf("=== 长整数用折叠法 ===\n");
    {
        long long id = 123456789LL;

        printf("  关键字 = %lld，表长 = %d\n", id, size);
        printf("  直接取余:         %lld %% %d = %d（只有低位参与）\n",
               id, size, (int)(id % size));
        printf("  折叠法（每3位一段）: %d（123+456+789 = 1368，再取余）\n",
               HashFold(id, size, 3));
        printf("  平方取中法:        %d\n", HashMidSquare(id, size, 3));
        printf("  （折叠法让每一段都参与运算，高位的差异不会丢）\n\n");
    }

//@s ===== 字符串 =====
    printf("=== 字符串散列 ===\n");
    {
        const char *words[] = { "abc", "cba", "bca", "acb", "cab", "bac" };
        int nw = 6;

        printf("  六个字母排列，看两种散列函数的区别：\n\n");
        printf("  %-8s %-14s %-14s\n", "字符串", "ASCII求和法", "移位相加法");
        printf("  -------- -------------- --------------\n");
        for (i = 0; i < nw; i++)
        {
            printf("  %-8s %-14d %-14d\n", words[i],
                   HashStringBad(words[i], size),
                   HashString(words[i], size));
        }
        printf("\n  （求和法下 abc/cba/bca/acb/cab/bac 全都一样 —— 加法满足交换律）\n");
        printf("  （移位相加法把它们分开了 —— 顺序参与运算）\n\n");
    }

//@s ===== 建一个真的散列表试试 =====
    printf("=== 建一个散列表看看 ===\n");
    {
        HashTable H = (HashTable)malloc(sizeof(struct TblNode));
        int m = NextPrime(10);

        H->TableSize = m;
        H->Cells = (Cell *)malloc(m * sizeof(Cell));
        for (i = 0; i < m; i++)
        {
            H->Cells[i].Info = Empty;
        }

//@s 先把整数关键字用"打散版取余"算出初始位置，再用线性探测找空位
        for (i = 0; i < n; i++)
        {
            Index h = HashModScramble(keys[i], m);
            int step = 0;
//@s 线性探测找个空位
            while (H->Cells[(h + step) % m].Info == Legitimate)
            {
                step++;
            }
            H->Cells[(h + step) % m].Data = keys[i];
            H->Cells[(h + step) % m].Info = Legitimate;
        }

        printf("表长 = %d\n", m);
        PrintTable(H);
        PrintStats(H);

        DestroyTable(H);
    }

//@s 总结
    printf("\n=== 散列函数的设计要点 ===\n");
    printf("  ① 计算要快（除留余数法只有一次取余）\n");
    printf("  ② 结果要在 [0, 表长) 范围内\n");
    printf("  ③ 分布要均匀 —— 表长取素数、关键字有规律时先打散\n");
    printf("  ④ 字符串用移位相加法，不要用简单求和\n");
    printf("\n但无论怎么设计，**冲突都无法完全避免** ——\n");
    printf("下一节就讲冲突了怎么办：开放地址法\n");

//@s 正常结束
    return 0;
}
//%end
