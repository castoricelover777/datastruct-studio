#%module | 01 | typedef | 头文件与 typedef | 2 |
#%summary | 散列表就是一个数组，每格带一个「状态」标记。
#@d ============ 为什么要"状态"而不只是"值" ============
#@d
#@d 数组里每格有三种可能：
#@d
#@d   Empty      从来没放过东西
#@d   Legitimate 这里有一个有效元素
#@d   Deleted    这里曾经有元素，被删掉了
#@d
#@d **为什么要单独区分 Empty 和 Deleted？**
#@d
#@d 因为线性探测的查找过程是"从散列位置往后一格一格找，**遇到 Empty 就停**"。
#@d
#@d 如果把删除的格子标成 Empty：
#@d
#@d   插入 25、38、51（假设都散列到同一格），它们会依次占据 12、13、14
#@d   现在删掉 38（下标 13），把它标成 Empty
#@d   再查 51：从 12 开始，往后走 —— 到 13 发现是 Empty，**以为后面没有了**，
#@d              于是报告"51 不存在" ✗  但它明明在 14！
#@d
#@d 所以删除的格子必须留个"墓碑"（Deleted）：
#@d 查找时**遇到它要继续往后走**，插入时可以把它当作空位复用。
#@d
#@d 这是散列里一个非常经典、也非常容易被忽略的坑。
#@d
#@d ============ 表长为什么取素数 ============
#@d
#@d 用"除留余数法"（k % TableSize）时，**表长取素数能让分布更均匀**。
#@d
#@d 举个反例：表长取 10（合数），关键字是"所有偶数"。
#@d
#@d   k % 10 的结果只可能是 0、2、4、6、8 —— **奇数格子全空着**
#@d
#@d 如果表长取 11（素数），偶数的余数就能落到所有 11 个格子上。
#@d
#@d 直观理解：素数和大多数数都"互质"，不会出现"只能落在某些格子上"的限制。
#@d
#@d ============ 这段 Python 和 C 有什么不一样 ============
#@d
#@d   C 的 typedef、struct、#define 全是在给编译器交代"这东西长什么样、占几个字节"；
#@d   Python 既不标类型也不管内存，所以上面那一大段到这儿只剩几个常量、两个 class。
#@d
#@d   C 的一个格子是 malloc 出来的，用完必须 free，忘了就漏内存；
#@d   Python 写一句 Cell() 对象就直接造好了，没人用了自己会被收走，没有 free 可写。
#@d
#@d   还有个小地方：C 的 enum 里 Empty 就是整数 0，Python 这边也照抄成 Empty = 0，
#@d   名字和值一个都没改 —— 这样下面那些 if (Info == Legitimate) 两边长得一模一样。

#@s 元素类型（关键字）
#@d C 的 typedef int ElementType; 是给类型起别名，Python 不看类型，这句只当记号留着。
ElementType = int

#@s 下标类型
#@d C 的 typedef int Index; 同样只当记号留着：Python 的整数只有一种，不分 int 和 long。
Index = int

#@s 散列表的最大容量
MAXTABLESIZE = 20000

#@s 每格的状态
#@d C 里是 typedef enum { Empty, Legitimate, Deleted } EntryType;，
#@d 这三个成员其实就是 0、1、2 三个整数，Python 用三行赋值代替，名字和值都不变。
#@s 从没放过东西
Empty = 0
#@s 有一个有效元素
Legitimate = 1
#@s 被删除了（墓碑）
Deleted = 2

#@s 一个格子
#@d C 的 struct HashEntry 只管"长什么样"，真格子还得 malloc 出来；
#@d Python 写成一个很小的 class，一个格子就是一个对象，两个字段名照抄 C 的。
class Cell:
    #@s 造格子时把这两个字段一次填好
    #@d C 那边是 malloc 完再挨个赋值，Python 的 __init__ 一次就位；
    #@d 这里给了默认值（0 和 Empty），所以 Cell() 造出来天然就是"空着"的状态。
    def __init__(self, data=0, info=Empty):
        #@s 存的关键字
        self.Data = data
        #@s 这个格子的状态
        self.Info = info

#@s 散列表
#@d C 的 struct TblNode 是"表长 + 一格数组的指针"，Python 就是一个有两个字段的 class。
class HashTable:
    #@s 建一个空表：先把两个字段摆好占位，真内容到 main 里再填
    def __init__(self):
        #@s 表长
        self.TableSize = 0
        #@s 格子数组
        #@d C 的 Cell *Cells; 只是声明了一个指针，那一排真格子是 main 里 malloc 的；
        #@d Python 先给个空列表占位，格子到时候再一个个造出来。
        self.Cells = []

#@s 状态码
OK = 1
ERROR = 0
#@d C 的 typedef int Status; 只是给返回值起个别名，Python 不看返回类型，这句只当记号留着。
Status = int

#@s 表示"没找到"的特殊值
NOTFOUND = -1

#@s 释放散列表
#@d C 要连着 free 两次；Python 有自动回收，这个函数只剩下"把引用清掉"的意思。
def DestroyTable(H):
    #@s 空指针不管
    if H is None:
        return
    #@s 先放格子数组
    #@d C 这里是 free(H->Cells);，Python 没有 free，清掉引用就等于说"这些格子不要了"
    H.Cells = None
    #@s 再放表结构
    #@d C 这里是 free(H);，Python 不用写 —— 函数返回后没人再引用 H，它自己会被收走
#%end

#%module | 02 | NextPrime | NextPrime —— 找一个素数当表长 | 2 | 01 |
#%summary | 从 N 往上找第一个素数，用来当表长。
#@d ============ 为什么表长要取素数 ============
#@d
#@d 因为最常用的散列函数是"除留余数法" `k % TableSize`。
#@d
#@d 如果表长是合数，就存在"只能落在部分格子"的问题。
#@d
#@d   表长 10，关键字都是偶数 → 只能落在 0 2 4 6 8，一半的格子永远空着
#@d   表长 12，关键字都是 3 的倍数 → 只能落在 0 3 6 9
#@d
#@d 换成素数就没这个问题：素数和大多数数互质，余数能均匀铺开。
#@d
#@d ============ 怎么高效地找素数 ============
#@d
#@d 试除法：对 p 检查有没有 2 到 √p 之间的因子。
#@d
#@d 两个小优化：
#@d
#@d   · 从 √p 往下试（因为因子成对出现，试到 √p 就够了）
#@d   · **只试奇数**：偶数除了 2 都不是素数，所以从 N 往上时直接跳到奇数
#@d
#@d 第二个优化很实用：光跳过偶数就省了一半检查。
#@d
#@d 复杂度上，试除是 O(√p)，而素数之间的平均间隔是 O(log p)，
#@d 所以找下一个素数的开销可以接受 —— 而且它只在建表时做一次。
#@d
#@d ============ 这段 Python 和 C 有什么不一样 ============
#@d
#@d   C 的 int i; int p; 是"先声明再使用"，Python 没有声明这一步，
#@d   i 和 p 都是第一次赋值的时候才冒出来的。
#@d
#@d   C 的三目运算符 (N % 2 != 0) ? N : N + 1，Python 写作 N if N % 2 != 0 else N + 1，
#@d   条件和两个结果的位置换了一下，意思完全一样。
#@d
#@d   最容易踩的坑是除号：C 的 p / 2 两个 int 相除，是整除；Python 的 / 永远算出小数，
#@d   必须写 p // 2。少打一个斜杠，i 就变成 5.5 这种小数，循环和比较全乱套。

#@s 取不小于 N 的下一个素数（和 06-02、06-03 那份实现一样）
def NextPrime(N):
    #@s 循环用
    #@s 待检查
    #@d C 这里连着写 int i; 和 int p; 两句声明，Python 不用提前声明：
    #@d i 是下面 while 里第一次赋值才有的，p 也一样。

    #@s N 太小就直接给出答案
    #@d C 是两个 if（N <= 2 返回 2，N <= 3 返回 3），Python 一字不差照抄
    if N <= 2:
        return 2
    if N <= 3:
        return 3

    #@s 先看 N 本身是不是素数（N 是偶数就先加一到奇数）
    #@d C 是三目运算符写的，Python 把条件挪到中间，读起来就是"是奇数就留 N，否则加一"
    p = N if N % 2 != 0 else N + 1

    #@s 往上找
    #@d 上界要留足余量 —— 否则 p 一超界就直接返回非素数了。
    while p <= MAXTABLESIZE:
        #@s 从 p/2 往下试除
        #@d C 是 for (i = (int)(p / 2); i > 2; i--)，靠 i-- 自己往下退，正常走完时 i 正好停在 2。
        #@d Python 的 for 取不到终点那个数（range 是左闭右开的），照抄的话 i 会停在 3，
        #@d 下面那句 if i == 2 就永远不成立 —— 所以这里改成 while 手写 i -= 1，
        #@d 退出时 i 的值和 C 一模一样。
        i = p // 2
        while i > 2:
            if p % i == 0:
                break
            i -= 1

        #@s 除到 i == 2 都没找到因子，说明 p 是素数
        if i == 2:
            break

        #@s 否则试下一个奇数
        p += 2

    #@s 返回
    return p
#%end

#%module | 03 | HashMod | HashMod —— 除留余数法 | 3 | 01,02 |
#%summary | 最常用的散列函数：关键字直接对表长取余。
#@d ============ 为什么它最常用 ============
#@d
#@d   ① **计算极快**：一次取余运算
#@d   ② **结果一定在 [0, TableSize) 范围内**：天然就是合法下标
#@d   ③ 只要表长选得好（素数），分布就很均匀
#@d
#@d 这三条让它成了绝大多数实现的选择。
#@d
#@d ============ 它适用于什么样的关键字 ============
#@d
#@d **随机性比较好**的关键字。
#@d
#@d 比如学号、身份证后几位、随机生成的 ID —— 取余之后分布很均匀。
#@d
#@d 但如果关键字有"规律"，效果就差：
#@d
#@d   全是 10 的倍数（100, 200, 300……）而表长取 10
#@d   → 余数全是 0，**全挤在一格**
#@d
#@d 所以这种情况要先"打散"一下再取余（比如先平方取中、或者乘一个常数）。
#@d
#@d ============ 这段 Python 和 C 有什么不一样 ============
#@d
#@d   取余的 % 两边都有，但**负数的规则不同**：C 的 % 是"截断"的（-3 % 11 得 -3），
#@d   Python 的 % 是"向下取整"的（-3 % 11 得 8）。本节的关键字全是正数，
#@d   两边算出来一模一样；真拿负数来散列，C 那边还会掉出 [0, 表长) 的范围。
#@d
#@d   另一个差别在溢出：C 的 int 只有 32 位，乘一个大点的数就回绕；Python 的整数
#@d   想多长有多长，永远不会自己回绕 —— 下面 HashModScramble 里得手动补这一刀。

#@s 除留余数法
def HashMod(Key, TableSize):
    #@s 直接取余
    return Key % TableSize

#@s 带打散的除留余数法（用于有规律的关键字）
#@d 先乘一个与表长互质的常数、再取余，能明显改善分布。
def HashModScramble(Key, TableSize):
    #@s 乘一个奇数再取余
    #@d 乘法定理：只要乘数与表长互质，就能保证映射是一一对应的。
    #@s 先把乘积算出来
    prod = Key * 31
    #@s 把乘积按 C 的 int 掰回 32 位
    #@d C 的 Key 是 int，只有 32 位，Key * 31 一超过 2³¹ - 1 就溢出 —— 有符号溢出在 C 里
    #@d 属于"未定义行为"，gcc 在 x86 上实际做的是按 2³² 回绕成负数。Python 的整数无限长，
    #@d 不会自己回绕，所以要显式地做下面两步，才能和 C 得出同一个数：
    #@d 先 % (1 << 32) 只留低 32 位，再把最高位当成符号位减回来。
    #@d 本节的关键字最大才 800，乘 31 是 24800，这两行其实用不上 ——
    #@d 留着是为了"不管传什么进来，两边算出的数都一样"。
    prod = prod % (1 << 32)
    if prod >= (1 << 31):
        prod -= 1 << 32
    #@s 再对表长取余
    #@d C 的 % 是"截断"的：被除数是负数时余数也是负数（-10 % 11 得 -10）；Python 的 %
    #@d 是"向下取整"的（-10 % 11 得 1）。prod 只有在上一步溢出过之后才可能是负数，
    #@d 那种情况就按 C 的规则算 —— 这样不管传什么进来，两边得到的都是同一个数。
    if prod < 0:
        return -((-prod) % TableSize)
    return prod % TableSize
#%end

#%module | 04 | HashFold | HashFold —— 折叠法与平方取中法 | 2 | 01 |
#%summary | 关键字太长或太有规律时，先用别的办法打散。
#@d ============ 折叠法（Folding） ============
#@d
#@d 适用于**关键字位数很多**的情况，比如一个 12 位身份证号。
#@d
#@d 做法：把关键字按位数切段，各段**相加**，再对表长取余。
#@d
#@d 举例，关键字 123456789，表长 1000，每段 3 位：
#@d
#@d   123 + 456 + 789 = 1368
#@d   1368 % 1000 = 368
#@d
#@d 好处是**每一段的信息都用上了**。如果直接对 123456789 取余，
#@d 只有低位参与运算，高位的差异全丢了。
#@d
#@d 还有一种是"**移位折叠**"：奇数段正着加、偶数段倒着加 ——
#@d 比直接相加更能打散。
#@d
#@d ============ 平方取中法（Mid-Square） ============
#@d
#@d 做法：先把关键字**平方**，然后取中间几位。
#@d
#@d 举例，关键字 1234，表长 1000：
#@d
#@d   1234² = 1522756
#@d   取中间 3 位 → 227（或者 522，看从哪儿开始取）
#@d
#@d 为什么有效？因为**平方之后，原数的每一位都会影响结果的中间位**。
#@d 这正好弥补了"除留余数法只看低位"的缺点。
#@d
#@d 教材上经典的一句话：**"平方取中法对每一位数字都有影响，
#@d 所以得到的散列地址比较均匀。"**
#@d
#@d ============ 这段 Python 和 C 有什么不一样 ============
#@d
#@d   C 这两个函数用的是 long long（64 位），Python 的整数是无限长。123456789² 大约是
#@d   1.5 亿亿，离 long long 的上限（约 9.2 亿亿）还远，所以这里不用像字符串散列那样
#@d   手动掰回 32 位。关键字长到 19 位以上时 C 的 long long 也会回绕，那时候两边就不一样了 ——
#@d   本节和驱动里的关键字都是 9 位数，离得很远。
#@d
#@d   两个除号要当心：C 的 Key /= base、sq /= 10 两边都是整数，本来就是整除；
#@d   Python 的 / 会算出小数，必须写成 //= —— 这里少打一个斜杠，
#@d   后面 % TableSize 的结果就全变了。
#@d
#@d   名字上有个小坑：C 里的 sum 到 Python 里还叫 sum，可 Python 自带一个内置函数
#@d   sum()，被这个变量挡住了。本函数里用不到内置那个，所以相安无事。

#@s 折叠法：按每段 width 位切开，相加后取余
def HashFold(Key, TableSize, width):
    #@s 累加结果
    sum = 0
    #@s 每一段
    #@s 10^width，用来切段
    base = 1
    #@s 循环用
    #@d C 这里是 long long sum = 0; long long part; long long base = 1; int i; 四句，
    #@d Python 一句声明都不用写：part 到循环里第一次算出来才存在，i 由下面的 for 现造。

    #@s 先算出 10^width
    for i in range(width):
        base *= 10

    #@s 一段一段切，切完就累加
    while Key > 0:
        #@s 取出最低的 width 位
        part = Key % base
        #@s 剩下的部分留到下一轮
        #@d C 的 Key /= base 是整除，Python 必须写 //=，少一个斜杠 Key 就变成小数了
        Key //= base
        #@s 累加这一段
        sum += part

    #@s 对表长取余
    return sum % TableSize

#@s 平方取中法：先平方，再取中间的 digits 位
def HashMidSquare(Key, TableSize, digits):
    #@s 平方
    sq = Key * Key
    #@s 用来取中间位的除数
    base = 1
    #@s 循环用
    #@d C 这里是 long long sq; long long base = 1; int i;，Python 不写声明，i 交给 for

    #@s 算出 10^digits
    for i in range(digits):
        base *= 10

    #@s 先去掉低位的一些位（取中而非取低）
    #@d 这里简化为"去掉最低的 digits/2 位，再取 digits 位"。
    #@d 照 C 版实际做的来：固定除以 10，只砍掉最低的 1 位（digits = 3 时 digits/2 正好是 1，
    #@d 和注释对得上）。Python 照抄这个除法，不改成 digits // 2。
    sq //= 10
    sq %= base

    #@s 最后对表长取余
    return sq % TableSize
#%end

#%module | 05 | HashString | HashString —— 字符串散列 | 3 | 01 |
#%summary | 字符串怎么变成一个下标 —— 移位相加法。
#@d ============ 为什么字符串需要特殊处理 ============
#@d
#@d 整数可以直接取余，但字符串不行。最直接的想法是"把每个字符的 ASCII 码加起来"：
#@d
#@d     h = 0;
#@d     while (*Key) h += *Key++;
#@d     return h % TableSize;
#@d
#@d 这个办法能用，但**分布很差**。因为加法**满足交换律**：
#@d
#@d     "abc" 和 "cba" 的 ASCII 和完全相同 → 散列到同一格
#@d     "abc" 和 "acb" 也是
#@d
#@d 单词里字母的排列组合很多，但"和"相同的却不少 —— 冲突会明显偏多。
#@d
#@d ============ 移位相加法 ============
#@d
#@d 改良办法是每次**先左移几位再加**：
#@d
#@d     h = (h << 5) + *Key++;
#@d
#@d 左移 5 位等于乘以 32。这样一来顺序就重要了：
#@d
#@d     "abc" → ((0*32 + 97)*32 + 98)*32 + 99
#@d     "cba" → ((0*32 + 99)*32 + 98)*32 + 97
#@d
#@d 两者显然不同了。
#@d
#@d 这就是 **Horner 法则**（也就是"秦九韶算法"）—— 把字符串看成
#@d 一个 32 进制的数，从高位到低位逐位累积。
#@d
#@d ============ 几个实用细节 ============
#@d
#@d ① **用 unsigned int 而不是 int**：左移和累加会很快溢出，
#@d    无符号数的溢出是"回绕"，行为有定义；有符号数溢出是未定义行为。
#@d
#@d ② 乘数取 31 或 32 是经验值。乘 31 有个额外好处：
#@d    编译器能优化成 `(h << 5) - h`，比真的乘法快。
#@d    （Java 的 String.hashCode 用的就是 31。）
#@d
#@d ③ 表长仍然应该取素数，配合取余的效果最好。
#@d
#@d ============ 这段 Python 和 C 有什么不一样 ============
#@d
#@d   最要命的是溢出。C 的 h 是 unsigned int，只有 32 位，一边乘 32 一边加字符，
#@d   几个字符就冲出去了 —— 无符号数溢出是"按 2³² 回绕"，规则明确、结果唯一。
#@d   Python 的整数想多长有多长，永远不会自己回绕，所以要自己写一句 % (1 << 32)，
#@d   每加一个字符就把 h 拉回 32 位，才能和 C 算出同一个散列值。
#@d
#@d   字符也不一样。C 的 Key 是 char 指针，一个字节一个字节地走，而且 x86 上 char
#@d   默认是**有符号**的，字节值 128 以上的会变成负数，C 用 (unsigned char) 把它掰回
#@d   0~255。Python 的 str 是"字符"不是字节，ord() 取到的是 Unicode 码点（汉字一下就
#@d   对不上了），所以这里先 encode('utf-8') 变回和 C 完全一样的字节串再逐字节取，
#@d   取出来的天然就是 0~255。
#@d
#@d   还有指针：C 的 while (*Key != '\0') { ...; Key++; } 要自己挪指针、自己判断结束，
#@d   Python 直接 for 一个字节串就行，末尾也没有 '\0' 这个字符。

#@s 字符串散列：移位相加法
#@d 乘数是 32（左移 5 位），累积成"32 进制数"。
def HashString(Key, TableSize):
    #@s 用无符号数，溢出行为有定义
    #@d C 的 h 是 unsigned int（32 位）：乘着乘着超过 2³² 就自动回绕，这是"有定义"的行为。
    #@d Python 的整数不会自己回绕，所以下面每加一个字符都要手动 % (1 << 32) 把它拉回 32 位，
    #@d 这一步就是在模拟 C 的溢出 —— 少了它，长一点的字符串两边算出来就不一样了。
    h = 0

    #@s 逐字符累积
    #@d h = h * 32 + c —— 每一步都把之前所有字符的影响保留下来。
    #@s 先把字符串变成字节串
    #@d C 的 Key 是一个字节一个字节走的，str 的 encode('utf-8') 拿到的就是同一串字节
    data = Key.encode('utf-8')

    #@s 一个字节一个字节地累
    #@d C 的 (unsigned char)(*Key) 是把字节当 0~255 的无符号数用 —— 少了这个转换，
    #@d 有符号的 char 遇到 128 以上的字节会给出负数，h 就被污染了。
    #@d Python 从 bytes 里取出来的字节本来就在 0~255，不用转换。
    for b in data:
        #@s 左移 5 位相当于乘 32，再加上这个字节
        #@s 这一步的 % (1 << 32) 就是 C 的"unsigned int 按 2³² 回绕"
        h = ((h << 5) + b) % (1 << 32)

    #@s 对表长取余
    return h % TableSize

#@s 对比用：最简单的"ASCII 求和"散列
#@d 分布差，但能直观看出"交换律"带来的问题。
def HashStringBad(Key, TableSize):
    #@s 累加
    #@d 这里的 h 也是 unsigned int，一样会在 32 位上回绕（要把和撑到 2³²，
    #@d 得一千七百万个字节才碰得到），照样写全，图的是和 C 一个数都不差。
    h = 0

    #@s 一个字节一个字节地加
    #@d C 写的是 h += (unsigned char)(*Key);，Python 的字节本来就在 0~255，不用转换
    for b in Key.encode('utf-8'):
        h = (h + b) % (1 << 32)

    #@s 对表长取余
    return h % TableSize
#%end

#%module | 06 | PrintHash | PrintHash —— 打印与统计 | 1 | 01 |
#%summary | 打印散列表、统计分布均匀程度。
#@d ============ 怎么判断"散列函数好不好" ============
#@d
#@d 一个直观的指标：**看各个格子被用到的次数是否均匀**。
#@d
#@d 好的散列函数：每个格子被用到的次数差不多。
#@d 差的散列函数：有的格子挤爆、有的格子永远空着。
#@d
#@d 另一种更定量的说法是"**冲突次数**"：
#@d n 个关键字散列到 m 个格子，理想的冲突次数接近 n²/(2m)。
#@d 实际冲突数比这个明显大，就说明散列函数有问题。
#@d
#@d ============ 这段 Python 和 C 有什么不一样 ============
#@d
#@d   C 的 %4d 是"占 4 格、右对齐"，Python 写成 f'{i:4d}'；%4s 也一样，写 f'{"X":>4}'。
#@d   数字是 ASCII，两边宽度算出来一样；汉字就不一样了，下面 PadRight 里细说。
#@d
#@d   换行要留神：C 是手动 printf("\n")，Python 的 print 自带换行。所以"一行分几段打"
#@d   的地方，前几段得写 end='' 把这一行攒着，最后再 print() 收尾。
#@d
#@d   C 的 (double)(used + deleted) / H->TableSize 是浮点除，Python 的 / 本来就是浮点除，
#@d   直接写就行；%.2f 对应 f'{x:.2f}'，都是保留两位小数。

#@s 打印散列表的内容
def PrintTable(H):
    #@s 循环用
    #@d C 这儿写 int i;，Python 的 i 由下面两个 for 各自现造

    #@s 先打一行下标
    #@d C 是 printf("下标: ") 再一个 for 打 %4d；Python 的 print 打完就换行，
    #@d 所以先用 end='' 把这一行攒住，数字全打完再 print() 收尾
    print('下标: ', end='')
    for i in range(H.TableSize):
        #@s 每个下标占 4 格
        print(f'{i:4d}', end='')
    print()

    #@s 再打一行内容：有效元素打数据，墓碑打 X，空位打 -
    print('内容: ', end='')
    for i in range(H.TableSize):
        if H.Cells[i].Info == Legitimate:
            print(f'{H.Cells[i].Data:4d}', end='')
        elif H.Cells[i].Info == Deleted:
            #@s 墓碑
            print(f'{"X":>4}', end='')
        else:
            #@s 空位
            print(f'{"-":>4}', end='')
    print()

#@s 统计每种状态各有多少格
def PrintStats(H):
    #@s 循环用
    #@s 三种计数
    empty = 0
    used = 0
    deleted = 0
    #@d C 是 int i; 和 int empty = 0, used = 0, deleted = 0;，Python 一行一个变量

    #@s 挨个数一遍
    for i in range(H.TableSize):
        if H.Cells[i].Info == Empty:
            empty += 1
        elif H.Cells[i].Info == Legitimate:
            used += 1
        else:
            deleted += 1

    #@s 空多少格、有元素多少格、墓碑多少格
    #@d C 是 printf("  空 %d 格，有元素 %d 格，墓碑 %d 格\n", ...)，Python 用一条
    #@d f-string 整个拼好；写成 print('  空', empty, ...) 会在每个逗号的位置多出空格
    print(f'  空 {empty} 格，有元素 {used} 格，墓碑 {deleted} 格')
    #@s 装填因子 = 用了的格子（有元素 + 墓碑）/ 表长
    print(f'  装填因子 = {used + deleted} / {H.TableSize} = {(used + deleted) / H.TableSize:.2f}')

#@s C 里没有这个函数，是 Python 版补的：把字符串按**字节数**左对齐补空格
#@d C 的 %-8s 数的是**字节数**：一个汉字在 UTF-8 里占 3 个字节，所以 "字符串"（9 字节）
#@d 比 8 还宽，C 一个空格都不补。Python 的 f'{"字符串":<8}' 数的是**字符数**（3 个），
#@d 会老老实实补 5 个空格 —— 表头就打歪了。所以这里自己按字节补。
def PadRight(s, width):
    #@s 先量它占了几个字节
    n = len(s.encode('utf-8'))
    #@s 不够宽才补空格；已经够宽（甚至超出）就原样返回，跟 C 的行为一样
    if n < width:
        return s + ' ' * (width - n)
    return s
#%end

#%module | 07 | main | main —— 几种散列函数对比 | 3 | 01,02,03,04,05,06 |
#%summary | 同一批关键字，几种散列函数的分布差别很明显。
#@d ============ 怎么看出差别 ============
#@d
#@d 关键是准备一批**有规律的关键字**，让"差的散列函数"暴露问题。
#@d
#@d 比如"全是 10 的倍数"这类数据：
#@d
#@d   直接取余（表长 10）→ 全挤在 0 号格
#@d   先乘 31 再取余       → 均匀铺开
#@d
#@d 字符串也一样："abc" 和 "cba" 在"求和法"下会撞车，在"移位法"下不会。
#@d
#@d ============ 这段 Python 和 C 有什么不一样 ============
#@d
#@d   C 的入口是 int main(void)，系统会自动来调它；Python 没有这么个入口，
#@d   惯例是写 if __name__ == '__main__': —— 意思是"这个文件被直接运行时才跑"。
#@d
#@d   C 的三段式 for (i = 10; i <= 14; i++) 到 Python 是 range(10, 15)：
#@d   右端的 15 取不到，所以要写成"上限 + 1"，这是最容易数错一位的地方。
#@d
#@d   printf 里的 %d 得跟后面参数一个个对上，Python 用 f-string 把变量直接塞进 {}；
#@d   但有个大坑：C 的 printf("%d ", x) 每个数后面都带一个空格（连最后一个也带），
#@d   Python 的 print(x) 是换行，print(a, b) 又会在中间多出空格 ——
#@d   所以"逐个数打一行"的地方统一写 print(x, end=' ')，末尾那个空格才不会丢。
#@d
#@d   C 的 %% 是"打一个百分号"，Python 的 f-string 里 % 就是普通字符，写一个就行。

#@s 主函数
#@d C 里这里是 int main(void)，Python 用下面这行固定写法代替
if __name__ == '__main__':
    #@s 表长：从 10 开始找素数
    #@s 循环用
    #@s 一组"有规律"的关键字：全是 10 的倍数
    keys = [100, 200, 300, 400, 500, 600, 700, 800]
    #@s 关键字个数
    n = 8
    #@s 统计每个格子被用到几次
    hits = [0] * 64
    #@s 冲突次数
    #@d C 在这里连着写 int size; int i; int hits[64]; int conflict; 四句声明。
    #@d Python 没有"先声明、回头再赋值"这回事：size 和 i、conflict 都是用到才出现，
    #@d 只有 hits 必须带着初值出现（C 的 int hits[64] 也没初值，可 C 允许先空着）。
    conflict = 0

    #@s ===== 表长的选择 =====
    print('=== 表长取素数 ===')
    print('要求表长不小于 10：')
    #@s 从 10 试到 14，看 NextPrime 都找出什么来
    #@d C 的三段式 for (i = 10; i <= 14; i++) 换成 range(10, 15)：右端取不到，所以要 +1
    for i in range(10, 15):
        print(f'  NextPrime({i}) = {NextPrime(i)}')
    #@s 表长就取 NextPrime(10)
    size = NextPrime(10)
    #@s C 这句 printf 末尾是 \n\n，"打完再空一行"；Python 就是 print 之后再补一个空 print
    print('（素数做表长，除留余数法的分布才均匀）')
    print()

    #@s ===== 对比两种散列函数 =====
    print('=== 关键字都是 10 的倍数：100, 200, ..., 800 ===')
    print()

    #@s 第一种：直接取余
    print(f'--- HashMod（直接取余 k % {size}）---')
    #@s 先把每个格子的计数清零
    for i in range(size):
        hits[i] = 0
    #@s 冲突次数也清零
    conflict = 0
    #@s 一个个散列下去：撞上已经有人的格子，就记一次冲突
    for i in range(n):
        h = HashMod(keys[i], size)
        if hits[h] > 0:
            conflict += 1
        hits[h] += 1
    #@s 每个关键字落在哪一格（C 的 printf 每个数后面跟两个空格，Python 把空格写进 f-string 里）
    print('  散列结果: ', end='')
    for i in range(n):
        print(f'{keys[i]}→{HashMod(keys[i], size)}  ', end='')
    print()
    #@s 冲突次数
    print(f'  冲突次数: {conflict}')
    #@s 每个格子被用到几次
    print('  分布: ', end='')
    for i in range(size):
        print(f'{hits[i]} ', end='')
    print()
    print(f'  （关键字全是 100 的倍数，{size} = 1×100，所以余数都有规律）')
    print()

    #@s 第二种：先乘 31 再取余
    print('--- HashModScramble（先乘 31 再取余）---')
    #@s 计数清零
    for i in range(size):
        hits[i] = 0
    #@s 冲突次数清零
    conflict = 0
    #@s 再来一遍，这回用打散过的散列函数
    for i in range(n):
        h = HashModScramble(keys[i], size)
        if hits[h] > 0:
            conflict += 1
        hits[h] += 1
    #@s 散列结果
    print('  散列结果: ', end='')
    for i in range(n):
        print(f'{keys[i]}→{HashModScramble(keys[i], size)}  ', end='')
    print()
    #@s 冲突次数
    print(f'  冲突次数: {conflict}')
    #@s 分布
    print('  分布: ', end='')
    for i in range(size):
        print(f'{hits[i]} ', end='')
    print()
    print('  （乘 31 把规律打散了，分布明显更均匀）')
    print()

    #@s ===== 长整数：折叠法 =====
    print('=== 长整数用折叠法 ===')
    #@s 一个 9 位数：高位低位都有信息
    #@d C 写的是 123456789LL，尾巴那个 LL 是"这是 long long"，Python 的整数不分长短，不写。
    #@d 另外 id 这个名字在 Python 里本来是个内置函数，这儿被变量挡住了 —— 本段用不到
    #@d 那个内置函数，所以相安无事（想避开的话换个名字就行，比如 key）。
    id = 123456789

    #@s 关键字和表长先报一下
    print(f'  关键字 = {id}，表长 = {size}')
    #@s 直接取余：只有最低几位参与了运算
    print(f'  直接取余:         {id} % {size} = {id % size}（只有低位参与）')
    #@s 折叠法：123 + 456 + 789 = 1368，再对表长取余
    print(f'  折叠法（每3位一段）: {HashFold(id, size, 3)}（123+456+789 = 1368，再取余）')
    #@s 平方取中法
    print(f'  平方取中法:        {HashMidSquare(id, size, 3)}')
    print('  （折叠法让每一段都参与运算，高位的差异不会丢）')
    print()

    #@s ===== 字符串 =====
    print('=== 字符串散列 ===')
    #@s 六个字母的排列：字母一样，顺序不同
    words = ["abc", "cba", "bca", "acb", "cab", "bac"]
    #@s 字符串个数
    nw = 6

    print('  六个字母排列，看两种散列函数的区别：')
    print()
    #@s 表头
    #@d C 的 %-8s 是按**字节数**左对齐补空格："字符串" 在 UTF-8 里占 9 个字节，比 8 还宽，
    #@d C 一个空格都不补；而 Python 的 f'{"字符串":<8}' 数的是字符个数（3 个），
    #@d 会多补 5 个空格，表头就跟 C 不一样了。所以这里统一用 PadRight 按字节补。
    print('  ' + PadRight('字符串', 8) + ' ' + PadRight('ASCII求和法', 14) + ' ' + PadRight('移位相加法', 14))
    print('  -------- -------------- --------------')
    #@s 一行一个排列，看两种散列函数各算出多少
    for i in range(nw):
        word = PadRight(words[i], 8)
        bad = HashStringBad(words[i], size)
        good = HashString(words[i], size)
        #@s %-14d 是"占 14 格、左对齐"，Python 写 {x:<14d}
        print(f'  {word} {bad:<14d} {good:<14d}')
    print()
    print('  （求和法下 abc/cba/bca/acb/cab/bac 全都一样 —— 加法满足交换律）')
    print('  （移位相加法把它们分开了 —— 顺序参与运算）')
    print()

    #@s ===== 建一个真的散列表试试 =====
    print('=== 建一个散列表看看 ===')
    #@s 表长还是从 10 开始找的那个素数
    m = NextPrime(10)
    #@s 造一张空表
    #@d C 要 malloc 两次：一次给表结构、一次给那一排 Cell，再一个 for 把每格的 Info 设成 Empty；
    #@d Python 的 HashTable() 加一句列表推导就够 —— Cell() 造出来本来就是 Empty 状态。
    H = HashTable()
    H.TableSize = m
    H.Cells = [Cell() for _ in range(m)]

    #@s 先把整数关键字用"打散版取余"算出初始位置，再用线性探测找空位
    #@d C 这句注释说的"字符串"其实没出现：塞进去的是上面那批整数关键字，
    #@d 用的是打散过的 HashModScramble。注释和代码对不上，这里照抄注释、按代码翻译。
    for i in range(n):
        h = HashModScramble(keys[i], m)
        #@s step 记录往后探了几格
        step = 0
        #@s 线性探测找个空位
        while H.Cells[(h + step) % m].Info == Legitimate:
            step += 1
        H.Cells[(h + step) % m].Data = keys[i]
        H.Cells[(h + step) % m].Info = Legitimate

    #@s 表长报一下
    print(f'表长 = {m}')
    #@s 把整张表和统计打出来
    PrintTable(H)
    PrintStats(H)
    #@s 用完释放（Python 里这一步纯粹是走个形式）
    DestroyTable(H)

    #@s 总结
    #@d C 这两个 printf 都以 \n 开头，是"先空一行"；Python 就是在标题前补一个空 print
    print()
    print('=== 散列函数的设计要点 ===')
    print('  ① 计算要快（除留余数法只有一次取余）')
    print('  ② 结果要在 [0, 表长) 范围内')
    print('  ③ 分布要均匀 —— 表长取素数、关键字有规律时先打散')
    print('  ④ 字符串用移位相加法，不要用简单求和')
    print()
    print('但无论怎么设计，**冲突都无法完全避免** ——')
    print('下一节就讲冲突了怎么办：开放地址法')

    #@s 正常结束
    #@d C 在这儿写 return 0;，Python 脚本跑到最后一行就算正常结束，不用写 return
#%end
