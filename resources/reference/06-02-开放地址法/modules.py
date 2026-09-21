#%module | 01 | typedef | 头文件与 typedef | 2 |
#%summary | 结构还是那个结构，重点是三种"探测"共用同一套格子。
#@d ============ 开放地址法和分离链接法的根本差别 ============
#@d
#@d   **开放地址法**：所有元素都存在**同一个数组**里，冲突了就另找空位
#@d   **分离链接法**：数组每格挂一条链表，冲突了就挂在链表上
#@d
#@d 所以开放地址法的数组必须**开得比元素多**（留出空位给探测），
#@d 而分离链接法的表长可以接近元素数。
#@d
#@d 反过来，开放地址法不需要任何指针和额外内存分配 —— 对缓存很友好，
#@d 实测往往比分离链接法快。这是个典型的"空间换时间 vs 时间换空间"的取舍。
#@d
#@d ============ 三种探测方式共用一套结构 ============
#@d
#@d 这一节的三种做法**只在"怎么算下一个位置"上不同**，其余完全一样：
#@d
#@d   线性探测：(h(k) + i) % TableSize
#@d   平方探测：(h(k) ± i²) % TableSize
#@d   双散列  ：(h(k) + i × h₂(k)) % TableSize
#@d
#@d 所以下面把它们写成三个查找函数，方便直接对比。
#@d 注意：**插入也靠查找** —— 先找到"该放的位置"，再填进去。
#@d 这也是散列实现的一个惯用手法：插入 = 查找 + 写入。
#@d
#@d ============ 这段 Python 和 C 有什么不一样 ============
#@d
#@d   C 要 #include <stdio.h> 才有 printf，Python 的 print 是自带的，
#@d   所以那两行 include 在这儿没有了。
#@d
#@d   C 用 typedef 给 int 起了 ElementType、Index、Status 这些名字，Python 没有
#@d   typedef，就写成 ElementType = int，它只是个普通变量，留着是为了和 C 版对得上。
#@d
#@d   C 的 enum { Empty, Legitimate, Deleted } 是从 0 开始往后编号的三个常量，
#@d   所以 C 里它们就是 0、1、2。Python 也照样写 0、1、2，值必须一模一样 ——
#@d   后面要判断 Info != Empty、Info == Legitimate，数字对不上判断就全错了。
#@d
#@d   C 的 struct 到 Python 就是一个 class，字段名一个都没改；C 的 H->Data
#@d   到 Python 是 H.Data，箭头换成一个小圆点。
#@d
#@d   C 的 typedef struct TblNode *HashTable 是"指向表结点的指针"的别名，
#@d   Python 没有指针，所以直接写 HashTable = TblNode，用法上是一回事。

#@s 元素类型
ElementType = int

#@s 下标类型
Index = int

#@s 表的最大容量
MAXTABLESIZE = 20000

#@s 格子的状态
#@s 从没放过
Empty = 0
#@s 有元素
Legitimate = 1
#@s 墓碑（删过东西）
Deleted = 2

#@s 一个格子
class Cell:
    def __init__(self):
        #@s 关键字
        self.Data = 0
        #@s 状态
        self.Info = Empty

#@s 散列表
class TblNode:
    def __init__(self):
        #@s 表长（素数）
        self.TableSize = 0
        #@s 格子数组
        #@d C 的 Cell *Cells 是一根指针，指向 malloc 出来的那一大块格子；
        #@d Python 没有指针，Cells 就是一个列表，建表的时候才填进去，所以先给 None。
        self.Cells = None

#@d C 那句 typedef struct TblNode *HashTable; 是给"指向表结点的指针"起名字，
#@d Python 直接写 HashTable = TblNode，后面 H = CreateTable(9) 拿到的就是表本身。
HashTable = TblNode

#@s 状态码
OK = 1
ERROR = 0
#@d C 的 typedef int Status; 是给返回类型起个别名，Python 不看类型，这句只当记号留着。
Status = int

#@s 没找到
NOTFOUND = -1

#@s 取不小于 N 的下一个素数（和 06-01 一样）
def NextPrime(N):
    #@s 循环用
    #@s 待检查
    #@d C 的 int i; 和 int p; 是提前声明，Python 不用声明，
    #@d 下面第一次赋值的时候它们才出现，所以这两行只留下说明。

    if N <= 2:
        return 2
    if N <= 3:
        return 3

    #@s 先看 N 本身是不是素数（N 是偶数就先加一到奇数）
    #@d C 写的是 p = (N % 2 != 0) ? N : N + 1;，Python 没有 ?: 这个写法，
    #@d 改成 if ... else ... 的条件表达式，念作"N 是奇数就取 N，否则取 N+1"。
    p = N if N % 2 != 0 else N + 1

    #@s 往上找
    #@d 上界要留足余量 —— 否则 p 一超界就直接返回非素数了。
    while p <= MAXTABLESIZE:
        #@s 从 p/2 往下试除
        #@d C 的 (int)(p / 2) 是整除，Python 必须写 p // 2 才是整除；
        #@d 写成 p / 2 会得到小数，range 和比较都会跟着出错。
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

#@s 建一个空表
def CreateTable(TableSize):
    #@s 表
    #@s 循环用
    #@d C 的 HashTable H; 和 int i; 都是提前声明：H 装表结点，i 给下面那个 for 用。
    #@d Python 不用提前声明，H 在下面一行才有，i 交给 for 自己生成，这里只留说明。

    #@s 分配
    #@d C 是 H = (HashTable)malloc(sizeof(struct TblNode));，
    #@d Python 写 H = TblNode()，不用算 sizeof，也不用写类型转换。
    H = TblNode()
    #@s 表长取素数
    H.TableSize = NextPrime(TableSize)
    #@s 分配格子
    #@d C 是 H->Cells = (Cell *)malloc(H->TableSize * sizeof(Cell));，
    #@d Python 用列表生成式一次造出 TableSize 个 Cell 对象，格子数和 C 一样多。
    H.Cells = [Cell() for _ in range(H.TableSize)]

    #@s 全部标成空
    for i in range(H.TableSize):
        H.Cells[i].Info = Empty
        H.Cells[i].Data = 0

    return H

#@s 释放
def DestroyTable(H):
    #@d C 里这句是 if (H == NULL) { return; }，Python 写 H is None 是一个意思。
    if H is None:
        return
    #@s 先放格子
    #@s 再放表
    #@d C 是 free(H->Cells); free(H); 两句。Python 没有 free，
    #@d 把 Cells 松开、剩下的交给垃圾回收就行，效果和"这块地不要了"一样。
    H.Cells = None
#%end

#%module | 02 | Hash | Hash —— 散列函数与第二个散列函数 | 2 | 01 |
#%summary | 除留余数法；再给双散列准备一个"第二个散列函数"。
#@d ============ 双散列为什么需要第二个函数 ============
#@d
#@d 双散列的探测序列是：
#@d
#@d     h(k) + i × h₂(k)      i = 0, 1, 2, ...
#@d
#@d 关键要求：**h₂(k) 不能是 0**。
#@d
#@d 如果 h₂(k) = 0，那整条探测序列全是 h(k)，原地打转，永远找不到空位。
#@d
#@d 所以第二个散列函数要保证结果落在 [1, TableSize-1] 范围内。
#@d
#@d 常见做法是：
#@d
#@d     h₂(k) = R - (k % R)      其中 R 是小于表长的素数
#@d
#@d 因为 k % R 落在 [0, R-1]，所以 R - (k % R) 落在 [1, R] —— 一定不为 0。
#@d
#@d ============ 为什么双散列效果最好 ============
#@d
#@d 线性探测的步长永远是 1，平方探测的步长是 1, 4, 9...（固定序列），
#@d 而双散列的步长**依赖关键字本身**：
#@d
#@d   关键字不同的人，走的路子也不同 → 不容易互相干扰
#@d
#@d 所以双散列最接近"随机探测"的理想效果，冲突最少。
#@d 代价是要多算一个散列函数。
#@d
#@d ============ 这段 Python 和 C 有什么不一样 ============
#@d
#@d   C 的 Index Hash(...) 里 Index 就是 int 的别名，Python 不看返回类型，
#@d   函数体 return Key % TableSize 一个字都不用改。
#@d
#@d   负数取模要留个心：C 的 % 遇到负的被除数结果也是负的（-1 % 11 得 -1），
#@d   Python 的 % 永远给非负数（-1 % 11 得 10）。这一节的关键字全是正数，
#@d   两边结果一样；真要用负数当关键字，C 会算出负下标而 Python 不会。
#@d
#@d   C 的 R = NextPrime(TableSize / 2) 里那个 / 是整除，Python 得写 //，
#@d   写成一个 / 会得到小数，NextPrime 里的比较就全乱套了。
#@d
#@d   C 的 (double)used / H->TableSize 是把 used 先转成小数再除，
#@d   Python 的 / 本来就是小数除法，所以那句 (double) 不用写。

#@s 主散列函数：除留余数法
def Hash(Key, TableSize):
    return Key % TableSize

#@s 第二个散列函数，用于双散列
#@d 保证返回值落在 [1, TableSize-1]，绝不会是 0。
def Hash2(Key, TableSize):
    #@s 取一个比表长小的素数
    #@d C 里这句是 int R = NextPrime(TableSize / 2);，那个 / 是整除，Python 写 //。
    R = NextPrime(TableSize // 2)

    #@s R - (k % R) 落在 [1, R]
    return R - (Key % R)

#@s 算装填因子
def LoadFactor(H):
    #@s 循环用
    #@s 已用格数（含墓碑）
    #@d C 的 int i; 交给下面的 for，int used = 0; 到 Python 就是一句 used = 0。
    used = 0

    for i in range(H.TableSize):
        if H.Cells[i].Info != Empty:
            used += 1
    return used / H.TableSize
#%end

#%module | 03 | FindLinear | FindLinear —— 线性探测 | 3 | 01,02 |
#%summary | 冲突了就试试下一格 —— 最简单，但会「扎堆」。
#@d ============ 线性探测的探测序列 ============
#@d
#@d     h(k), h(k)+1, h(k)+2, h(k)+3, ...
#@d
#@d 一格一格往后试，试到空位为止（越界就绕回表头）。
#@d
#@d 走一遍，表长 11，插入 20、31、42（都散列到 9）：
#@d
#@d   20 % 11 = 9  →  9 号空，放进去
#@d   31 % 11 = 9  →  9 号被占，试 10，空 → 放进去
#@d   42 % 11 = 9  →  9、10 都被占，试 0（绕回表头），空 → 放进去
#@d
#@d 结果：
#@d
#@d   下标:  0   1   2   3   4   5   6   7   8   9   10
#@d   值  : 42   -   -   -   -   -   -   -   -  20  31
#@d
#@d ============ 线性探测最大的问题：一次聚集 ============
#@d
#@d 看上例：20、31、42 本来只有 9 号格冲突，结果占了 9、10、0 三格。
#@d
#@d 现在如果有个新元素散列到 10 或 0，它就得继续往后试 ——
#@d **一个连续的块会越滚越大**。
#@d
#@d 这个现象叫**一次聚集（primary clustering）**：
#@d
#@d   一旦形成连续的占用块，任何散列到块内位置的元素都会被推得更远，
#@d   于是块继续变长 —— 恶性循环。
#@d
#@d 结果是：即使装填因子只有 0.5，平均探测次数也会明显高于理论值。
#@d
#@d ============ 为什么用它 ============
#@d
#@d 因为**顺序访问对 CPU 缓存极其友好**。
#@d
#@d 现代 CPU 读内存是按"缓存行"（64 字节）整块读的。
#@d 线性探测往后走的时候，后面几格很可能已经在缓存里了 —— 几乎不花额外代价。
#@d
#@d 所以虽然线性探测的理论探测次数最差，实测反而常常最快。
#@d 这也是为什么很多工业实现（比如 Python 的 dict）用它的变体。
#@d
#@d ============ 这段 Python 和 C 有什么不一样 ============
#@d
#@d   C 的探测次数是靠 int *probes 这个指针"写回"给调用者的，Python 的函数
#@d   可以直接返回两个值，所以这里写成 return 位置, 探测次数，调用者一句
#@d   pos, probes = FindLinear(H, Key) 就都接住了。
#@d
#@d   C 里 int i = 0; 这种提前声明 Python 不用，用到的时候直接赋值。
#@d
#@d   C 的 while 条件是两个 && 连起来的，Python 里写成 and，意思一样，
#@d   而且两边都是"前一半不成立就不看后一半"，不会多读一格。

#@s 线性探测查找：返回位置；没找到返回 -1
#@d 如果 Key 存在，返回它的位置；如果不存在，返回"第一个可以插入的位置"。
def FindLinear(H, Key):
    #@s 起始位置
    CurrentPos = Hash(Key, H.TableSize)
    #@s 当前位置
    NewPos = CurrentPos
    #@s 已经试了几次
    i = 0

    #@s 一步一步往后试
    #@d 循环条件有两个：这格不是空的（说明还有希望找到），且这格的值不是要找的。
    while H.Cells[NewPos].Info != Empty and H.Cells[NewPos].Data != Key:
        #@s 试下一格（越界就绕回表头）
        i += 1
        NewPos = (CurrentPos + i) % H.TableSize

        #@s 走遍全表都没找到 → 表满或不存在
        if i >= H.TableSize:
            return NOTFOUND, i

    #@s 记下探测次数
    probes = i + 1

    #@s 如果这一格有元素且值相等 → 找到了
    if H.Cells[NewPos].Info == Legitimate and H.Cells[NewPos].Data == Key:
        return NewPos, probes

    #@s 否则这格是空的（或墓碑）→ 说明 Key 不在表里，返回这个可插入的位置
    return NOTFOUND, probes
#%end

#%module | 04 | InsertLinear | InsertLinear —— 线性探测的插入 | 2 | 01,02,03 |
#%summary | 插入 = 先查找，找到空位就填进去。
#@d ============ 为什么插入能复用查找 ============
#@d
#@d 因为"找不到"和"该插哪儿"是同一件事：
#@d
#@d   查找时按探测序列往后走，走到 Empty 就停 —— 这时要么找到了，要么不存在
#@d   而这个停下来的空位，**正好就是插入该放的位置**
#@d
#@d 这两件事完全重合，所以很多教材干脆只写一个函数，
#@d 用"是否传入要插入的值"来区分查找和插入。
#@d
#@d 本课程分开写，是为了让两种操作的意图更清楚。
#@d
#@d ============ 墓碑可以复用 ============
#@d
#@d 插入时遇到 Deleted 的格子，可以直接占用它。
#@d
#@d 但要注意：**不能一遇到墓碑就插**，因为后面可能已经存在这个关键字了 ——
#@d 那样就插入了重复元素。
#@d
#@d 所以正确做法是记住"第一个遇到的墓碑位置"，继续往后找：
#@d
#@d   · 如果找到了相同关键字 → 说明已存在，什么都不做
#@d   · 如果遇到 Empty（说明肯定不存在）→ 插到**之前记的那个墓碑位置**
#@d
#@d 这个细节很容易漏。本模块为了简洁，采用"不处理重复插入"的简化版 ——
#@d 但你要知道正式实现该怎么做。
#@d
#@d ============ 这段 Python 和 C 有什么不一样 ============
#@d
#@d   和 FindLinear 一样，C 靠 int *probes 写回探测次数，Python 直接返回两个值：
#@d   return 插入位置, 探测次数，调用者用 total, probes = InsertLinear(...) 接。
#@d
#@d   C 的 H->Cells[NewPos].Data = Key; 到 Python 是 H.Cells[NewPos].Data = Key，
#@d   就是把格子里那个字段改掉；因为 Cells 是列表，函数里改完外面立刻看得见。
#@d
#@d   DeleteLinear 里 C 得先声明 int probes; 再把 &probes 传进 FindLinear，
#@d   Python 一句 pos, probes = FindLinear(H, Key) 就完了。

#@s 线性探测插入：成功返回插入位置，表满返回 -1
def InsertLinear(H, Key):
    #@s 起始位置
    CurrentPos = Hash(Key, H.TableSize)
    #@s 当前位置
    NewPos = CurrentPos
    #@s 试了几次
    i = 0

    #@s 找空位
    #@d 一直往后试，直到遇到真正空的格子（墓碑也算可用）。
    while H.Cells[NewPos].Info == Legitimate:
        #@s 已经存在就不重复插入
        if H.Cells[NewPos].Data == Key:
            return NewPos, i + 1

        #@s 试下一格
        i += 1
        NewPos = (CurrentPos + i) % H.TableSize

        #@s 绕了一整圈 → 表满
        if i >= H.TableSize:
            return NOTFOUND, i

    #@s 填进去
    H.Cells[NewPos].Data = Key
    H.Cells[NewPos].Info = Legitimate

    #@s 记录探测次数
    probes = i + 1

    #@s 返回位置
    return NewPos, probes

#@s 线性探测的删除：标成墓碑，不真的清空
#@d 直接标成 Empty 会把探测链断掉，后面的元素就找不到了。
def DeleteLinear(H, Key):
    #@s 探测次数（这里不关心，但还是得传个变量进去）
    #@s 先找到它
    #@d C 是先声明 int probes; 再调用 FindLinear(H, Key, &probes)，让函数把次数写回 probes。
    #@d Python 直接 pos, probes = FindLinear(H, Key) 一次接住两个返回值；
    #@d 这里的 probes 照样用不上，但写法上和 C 一样留着。
    pos, probes = FindLinear(H, Key)

    if pos < 0:
        return ERROR

    #@s 标成墓碑
    H.Cells[pos].Info = Deleted

    return OK
#%end

#%module | 05 | FindQuadratic | FindQuadratic —— 平方探测 | 3 | 01,02 |
#%summary | 步长改成 ±i²，缓解「扎堆」，但可能探测不到全表。
#@d ============ 平方探测的探测序列 ============
#@d
#@d     h(k) + 1², h(k) - 1², h(k) + 2², h(k) - 2², ...
#@d     也就是 h(k)±1, h(k)±4, h(k)±9, h(k)±16, ...
#@d
#@d 一左一右地跳，跳的幅度越来越大。
#@d
#@d 为什么这样能缓解聚集？
#@d
#@d 因为线性探测的问题在于"**散列到相近位置的元素会走同一条路**"。
#@d
#@d   20 % 11 = 9  →  试 10
#@d   31 % 11 = 9  →  试 10、0
#@d   42 % 11 = 9  →  试 10、0、1
#@d
#@d 它们全都沿着 9→10→0→1 走。而平方探测是 9→10→8→1→6……，
#@d **跳开了**，不容易形成连续的块。
#@d
#@d ============ 但它换来了一个新问题：二次聚集 ============
#@d
#@d **散列到同一个位置**的元素，探测序列仍然完全相同。
#@d
#@d 也就是说"同一起点"的元素依然会挤在一起。这个现象叫
#@d **二次聚集（secondary clustering）**。
#@d
#@d 比一次聚集好一些，但没根治 —— 根治要靠双散列。
#@d
#@d ============ 更要紧的问题：表长有讲究 ============
#@d
#@d 线性探测一定能走遍全表（因为它一格一格试）。
#@d **平方探测不一定。**
#@d
#@d 如果表长是合数，±i² 可能只覆盖到一半的格子，**有些位置永远试不到**。
#@d
#@d 教科书结论：**表长为形如 4k+3 的素数时，平方探测能覆盖全表。**
#@d
#@d 比如 7、11、19、23、31…… 都是 4k+3 形式的素数。
#@d （7 = 4×1+3，11 = 4×2+3，19 = 4×4+3）
#@d
#@d 所以用平方探测时，表长不能只取"任意素数"，还得满足这个条件。
#@d 这是个很容易被忽略的细节 —— 表长选错了，插入会"凭空失败"。
#@d
#@d ============ 这段 Python 和 C 有什么不一样 ============
#@d
#@d   先说这段最要紧的**负数取模**：C 的 % 遇到负的被除数，结果是负的
#@d   （-4 % 11 得 -4）；Python 的 % 永远给非负数（-4 % 11 得 7）。
#@d   这里的偏移量 offset 是可能为负的，所以两边本来会算出不同的位置！
#@d
#@d   好在 C 紧接着就有一句 while (NewPos < 0) NewPos += H->TableSize; 把它补回正的，
#@d   而 Python 这边 % 一步出来就已经是非负数了，那个 while 一次也不会进循环。
#@d   两条路最终落在同一格，所以这个 while 照抄过来最省事，也最好对照。
#@d
#@d   C 的 (i + 1) / 2 是整除，Python 必须写 (i + 1) // 2；
#@d   写成 / 会得到小数，平方之后就成了浮点数，位置就不再是整数了。
#@d
#@d   C 的 sign = -sign 在 Python 里一样能用，负负得正，两边翻牌的顺序相同。
#@d
#@d   和 FindLinear 一样，探测次数改成返回第二个值：return 位置, 探测次数。

#@s 平方探测查找：返回位置；没找到返回 -1
def FindQuadratic(H, Key):
    #@s 起始位置
    CurrentPos = Hash(Key, H.TableSize)
    #@s 当前位置
    NewPos = CurrentPos
    #@s 当前试探的步数
    i = 0
    #@s 正负方向
    sign = 1
    #@s 偏移量
    #@d C 的 int offset; 是提前声明，赋值在下面循环里；
    #@d Python 不用提前声明，所以这里只留下说明。

    while H.Cells[NewPos].Info != Empty and H.Cells[NewPos].Data != Key:
        #@s 步数加一
        i += 1

        #@s 奇数步往右、偶数步往左，幅度是 i² 的变化
        #@d 具体偏移：i=1 时 +1，i=2 时 -1，i=3 时 +2²=+4…… 这里用简化写法：
        #@d 偏移量 = sign × ((i + 1) / 2)²
        #@d C 的 / 是整除，Python 写成 //，否则 ((i+1)/2) 会变成 1.5 这种小数。
        offset = ((i + 1) // 2) * ((i + 1) // 2) * sign
        sign = -sign

        #@s 算出新位置并调整到合法范围
        #@d C 走到这儿 CurrentPos + offset 可能是负数，C 的 % 会留个负号，
        #@d 所以必须靠下面那个 while 一路加 TableSize 加回正数。
        #@d Python 的 % 本身就给非负数，两者最终落点是同一格。
        NewPos = (CurrentPos + offset) % H.TableSize
        while NewPos < 0:
            NewPos += H.TableSize

        #@s 试得太多就放弃
        if i >= H.TableSize:
            return NOTFOUND, i

    #@s 探测次数
    probes = i + 1

    #@s 找到了
    if H.Cells[NewPos].Info == Legitimate and H.Cells[NewPos].Data == Key:
        return NewPos, probes

    return NOTFOUND, probes
#%end

#%module | 06 | FindDouble | FindDouble —— 双散列 | 3 | 01,02 |
#%summary | 步长由一个额外散列函数决定 —— 最接近"随机探测"。
#@d ============ 双散列的探测序列 ============
#@d
#@d     h(k) + i × h₂(k)        i = 0, 1, 2, ...
#@d
#@d 步长不是固定的 1（线性）也不是固定的 1,4,9（平方），
#@d 而是**由关键字自己算出来的 h₂(k)**。
#@d
#@d 举例：表长 11，h₂(k) = 7 - (k % 7)
#@d
#@d   关键字 20：h = 9，h₂ = 7 - (20%7) = 7 - 6 = 1
#@d             探测序列：9、10、0、1、2……
#@d   关键字 31：h = 9，h₂ = 7 - (31%7) = 7 - 3 = 4
#@d             探测序列：9、2、6、10、3……  ← 完全不同的路子
#@d
#@d 这就是关键：**散列到同一个起始位置的两个元素，走的序列也不同**。
#@d 所以既没有一次聚集、也没有二次聚集。
#@d
#@d ============ 代价 ============
#@d
#@d   ① 多算一次散列函数（多一次取模运算）
#@d   ② h₂(k) 必须保证不为 0，否则原地打转
#@d   ③ h₂(k) 最好与表长互质，这样序列才能覆盖全表
#@d
#@d 第三条的常见做法：**表长取素数，h₂(k) 的结果落在 [1, 表长-1]**。
#@d 因为素数表长与任何比它小的正整数都互质，序列必然能走遍全表。
#@d
#@d ============ 这段 Python 和 C 有什么不一样 ============
#@d
#@d   C 的 Index step = Hash2(Key, H->TableSize); 里，Index 就是 int 的别名，
#@d   Python 直接 step = Hash2(Key, H.TableSize)，没有类型这一层。
#@d
#@d   步长是关键字自己算出来的，所以每个关键字往前走的路都不一样；
#@d   Python 这边 i * step 和 C 一样是整数乘法，不会有小数。
#@d
#@d   负数取模的差别在这条路上不会遇到：i 和 step 都是正的，
#@d   CurrentPos + i * step 永远非负，两边的 % 结果完全相同。
#@d
#@d   和另外两个查找一样，探测次数是第二个返回值：return 位置, 探测次数。

#@s 双散列查找：返回位置；没找到返回 -1
def FindDouble(H, Key):
    #@s 起始位置
    CurrentPos = Hash(Key, H.TableSize)
    #@s 当前位置
    NewPos = CurrentPos
    #@s 步长（由第二个散列函数决定）
    step = Hash2(Key, H.TableSize)
    #@s 试了几次
    i = 0

    while H.Cells[NewPos].Info != Empty and H.Cells[NewPos].Data != Key:
        #@s 走一步，步长是 step
        i += 1
        NewPos = (CurrentPos + i * step) % H.TableSize

        #@s 试遍了就放弃
        if i >= H.TableSize:
            return NOTFOUND, i

    #@s 探测次数
    probes = i + 1

    #@s 找到了
    if H.Cells[NewPos].Info == Legitimate and H.Cells[NewPos].Data == Key:
        return NewPos, probes

    return NOTFOUND, probes
#%end

#%module | 07 | PrintTable | PrintTable —— 打印与统计 | 1 | 01,02 |
#%summary | 打印散列表、算平均探测次数。
#@d ============ 平均探测次数才是关键指标 ============
#@d
#@d 三种探测方式"能不能找到"都能做到。区别在于**要找几次**。
#@d
#@d 所以要统计"插入 n 个元素一共探测了多少次"，除以 n 得到平均值。
#@d 这个数越小，说明冲突越少、性能越好。
#@d
#@d 另一个要看的指标是**最大探测次数** —— 它反映"最坏情况有多糟"。
#@d 一次聚集严重的话，某个元素可能要试十几次。
#@d
#@d ============ 这段 Python 和 C 有什么不一样 ============
#@d
#@d   C 的 printf("%4d", i) 是"右对齐占 4 格"，Python 写成 f'{i:4d}'，
#@d   出来的宽度一模一样，前面该补的空格一个不少。
#@d
#@d   C 的 printf("%4s", "X") 是打印字符串，Python 写成 f'{"X":>4}'，
#@d   那个 > 就是"靠右对齐"，和 %4s 的效果相同。
#@d
#@d   C 的 printf 不带自动换行，Python 的 print 自带一个，
#@d   所以每处都得写 end=''，只有最后那句 printf("\n") 才写成 print()。
#@d
#@d   C 里 int i; 是提前声明，Python 的 for i in range(...) 自己就造出来了。

#@s 打印散列表
def PrintTable(H):
    #@s 循环用
    #@d C 那句 int i; 是声明，Python 的 for 循环自己生成 i，这里只留下说明。

    #@s 位数少的时候一行打得下
    print('下标: ', end='')
    for i in range(H.TableSize):
        print(f'{i:4d}', end='')
    print('\n内容: ', end='')
    for i in range(H.TableSize):
        if H.Cells[i].Info == Legitimate:
            print(f'{H.Cells[i].Data:4d}', end='')
        elif H.Cells[i].Info == Deleted:
            print(f'{"X":>4}', end='')
        else:
            print(f'{"-":>4}', end='')
    print()
#%end

#%module | 08 | main | main —— 三种探测方式对比 | 3 | 01,02,03,04,05,06,07 |
#%summary | 同一批关键字，三种探测方式的探测次数差别很明显。
#@d ============ 怎么对比才公平 ============
#@d
#@d 要用**同一批关键字、同一个表长**，分别用三种方式插入，
#@d 然后比较总探测次数和最大探测次数。
#@d
#@d 为了把差别放大，这里故意挑一批**散列位置很集中**的关键字。
#@d 如果关键字本来就散得很开，三种方式都只用探测一次，看不出区别。
#@d
#@d ============ 这段 Python 和 C 有什么不一样 ============
#@d
#@d   C 的 int main(void) 是程序自己去调的入口，Python 没这回事，惯例写成
#@d   if __name__ == '__main__':，意思是"直接运行这个文件才执行"。
#@d
#@d   C 的 int InsertBatch(..., int *maxProbes) 是把最大探测次数写回给调用者，
#@d   Python 直接返回两个值：total, maxProbes = InsertBatch(H, keys, n, 1)。
#@d
#@d   C 的 static const ElementType keys[] = { 20, 31, ... }; 要先说类型、
#@d   长度也由编译器数；Python 直接 keys = [20, 31, ...]，一行就完事。
#@d
#@d   C 的 printf("...%d...\n", x) 在这儿写成 f'...{x}...'（字符串前面带 f，
#@d   花括号里直接填变量），打出来的字一模一样。要注意 print(a, b) 中间会
#@d   自动塞一个空格，而 printf 不会 —— 所以能用一条 f-string 拼完的就别拆开。
#@d
#@d   C 的 printf("%d ", x) 每个数后面都带一个空格（最后一个也带），
#@d   Python 得写成 print(f'{x} ', end='')，不能用 ' '.join(...)，那样最后一个没空格。
#@d
#@d   C 的 (double)total1 / n 是先转小数再除，Python 的 / 本来就是小数除法，
#@d   所以写成 total1 / n；平均次数保留一位小数用 f'{v:.1f}'，和 %.1f 一样。

#@s 用指定方式插入一批关键字，返回总探测次数
#@d method: 1=线性 2=平方 3=双散列
def InsertBatch(H, keys, n, method):
    #@s 循环用
    #@s 本次探测次数
    #@s 总探测次数
    #@s 起始位置和步长
    #@s 试了几次
    #@d C 上面这几行是 int i; int probes; int total = 0; Index CurrentPos, NewPos, step;
    #@d int k; 的一串提前声明，Python 不用声明，下面用到的时候才出现。
    total = 0

    #@s 最大探测次数
    #@d C 是 *maxProbes = 0; 先给指针指的那格清零，
    #@d Python 这边没有出参，用个普通变量 maxProbes 记着，最后一起返回。
    maxProbes = 0

    for i in range(n):
        #@s 算出起点
        CurrentPos = Hash(keys[i], H.TableSize)
        NewPos = CurrentPos
        #@d C 的三目运算符 (method == 3) ? Hash2(...) : 1，
        #@d Python 写成 if ... else ... 的条件表达式，规则一样。
        step = Hash2(keys[i], H.TableSize) if method == 3 else 1
        k = 0

        #@s 找空位
        while H.Cells[NewPos].Info == Legitimate:
            k += 1
            if method == 1:
                NewPos = (CurrentPos + k) % H.TableSize
            elif method == 2:
                #@d 这里的偏移量和 FindQuadratic 里是同一套：
                #@d k 是奇数往右、偶数往左，幅度 (k+1)/2 的平方。
                #@d C 的 / 是整除，Python 写 //；C 的 (k % 2) ? 1 : -1
                #@d 写成 1 if k % 2 != 0 else -1，正负号的顺序完全一致。
                offset = ((k + 1) // 2) * ((k + 1) // 2) * (1 if k % 2 != 0 else -1)
                NewPos = (CurrentPos + offset) % H.TableSize
                while NewPos < 0:
                    NewPos += H.TableSize
            else:
                NewPos = (CurrentPos + k * step) % H.TableSize

            if k >= H.TableSize:
                break

        #@s 填进去
        H.Cells[NewPos].Data = keys[i]
        H.Cells[NewPos].Info = Legitimate

        #@s 统计
        probes = k + 1
        total += probes
        if probes > maxProbes:
            maxProbes = probes

    return total, maxProbes

#@s 主函数
if __name__ == '__main__':
    #@s 故意挑一批散列位置集中的关键字
    #@d 表长 11 时，这些数对 11 取余分别是 9、9、9、9、9、9 —— 全撞在一起。
    #@d C 写的是 static const ElementType keys[] = { 20, 31, 42, 53, 64, 75 };，
    #@d Python 直接一个列表，长度也不用另说。
    keys = [20, 31, 42, 53, 64, 75]
    #@s 个数
    n = 6
    #@s 三个表
    #@s 循环用
    #@s 统计量
    #@s 探测次数
    #@d C 这几行是 HashTable H1, H2, H3; int i; int total1, total2, total3;
    #@d int max1, max2, max3; int probes; 的提前声明。Python 不用声明：
    #@d 三张表在下面 CreateTable 的时候出现，i 交给 for 循环，统计量赋值时才有。

    #@s ===== 先看关键字散列到哪 =====
    print('关键字: ', end='')
    for i in range(n):
        print(f'{keys[i]} ', end='')
    print('\n')

    print(f'表长 = {NextPrime(9)}（素数）')
    print('各关键字的散列位置：')
    for i in range(n):
        print(f'  {keys[i]} % {NextPrime(9)} = {Hash(keys[i], NextPrime(9))}', end='')
        if i == 0:
            print('   ← 全都撞在这个位置！', end='')
        print()
    print('\n（这样能最大程度暴露三种探测方式的差别）\n')

    #@s ===== 线性探测 =====
    H1 = CreateTable(9)
    total1, max1 = InsertBatch(H1, keys, n, 1)
    print('=== 线性探测 ===')
    PrintTable(H1)
    print(f'  总探测 {total1} 次，平均 {total1 / n:.1f} 次，最多 {max1} 次')
    print('  （会连成一片 —— 这就是「一次聚集」）\n')

    #@s ===== 平方探测 =====
    H2 = CreateTable(9)
    total2, max2 = InsertBatch(H2, keys, n, 2)
    print('=== 平方探测 ===')
    PrintTable(H2)
    print(f'  总探测 {total2} 次，平均 {total2 / n:.1f} 次，最多 {max2} 次')
    print('  （跳开了连续块，但同起点的元素仍走同一条序列）\n')

    #@s ===== 双散列 =====
    H3 = CreateTable(9)
    total3, max3 = InsertBatch(H3, keys, n, 3)
    print('=== 双散列 ===')
    PrintTable(H3)
    print(f'  总探测 {total3} 次，平均 {total3 / n:.1f} 次，最多 {max3} 次')
    print('  （步长由关键字决定，同起点的元素也走不同路子）\n')

    #@s ===== 查找测试 =====
    print('=== 查找测试（在线性探测的表里）===')
    for i in range(n):
        pos, probes = FindLinear(H1, keys[i])
        print(f'  找 {keys[i]}: 位置 {pos}，探测 {probes} 次')
    #@d C 这里单独套了一对 { }，是为了让 pos 这个名字只在那几行里有效；
    #@d Python 没有这种花括号作用域，直接往下写就行。
    pos, probes = FindLinear(H1, 999)
    print('  找 999（不存在）: ' + ('没找到' if pos < 0 else '找到了') + f'，探测 {probes} 次')
    print()

    #@s ===== 删除与墓碑 =====
    print('=== 删除测试 ===')
    #@d C 的 printf("...%s\n", DeleteLinear(H1, 31) == OK ? "成功" : "失败")
    #@d 换成 Python 的条件表达式，拼出来是同一句话。
    print('删除 31: ' + ('成功' if DeleteLinear(H1, 31) == OK else '失败'))
    PrintTable(H1)
    print('（31 的位置变成 X —— 墓碑，不是 Empty）')
    print('再找 42: ', end='')
    pos, probes = FindLinear(H1, 42)
    print(f'位置 {pos}，探测 {probes} 次')
    print('（还能找到 —— 因为查找遇到墓碑会继续往后走）')
    print('如果把 31 标成 Empty 而不是墓碑，42 就找不到了\n')

    #@s ===== 装填因子的影响 =====
    print('=== 装填因子的影响（理论值）===')
    print('  线性探测平均探测次数约 (1 + 1/(1-α)) / 2')
    print('  α=0.5 → 约 1.5 次')
    print('  α=0.75 → 约 2.5 次')
    print('  α=0.9 → 约 5.5 次  ← 迅速恶化\n')
    print('所以开放地址法的表**不能装太满**，一般 α 到 0.75 就该扩容')

    #@s 释放
    DestroyTable(H1)
    DestroyTable(H2)
    DestroyTable(H3)

    #@s 正常结束
    #@d C 最后是 return 0; 表示正常退出，Python 脚本跑到最后一行就自己结束了，
    #@d 所以那一句没有了。
#%end
