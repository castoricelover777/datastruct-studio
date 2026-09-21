#%module | 01 | typedef | 头文件与 typedef | 1 |
#%summary | 元素定义，以及基数排序要用到的位数、基数。
#@d ============ 表排序为什么有用 ============
#@d
#@d 假设要排一个"学生表"，每个学生有姓名、学号、成绩、备注……
#@d 一个结构体可能有几百字节。
#@d
#@d 如果直接搬动这些结构体：
#@d
#@d   排序 1000 个学生，移动次数 O(n²) 次 × 每次搬 500 字节 = 极其昂贵
#@d
#@d 但如果只搬"下标"：
#@d
#@d   每次只搬 4 字节（一个 int），速度直接差上百倍
#@d
#@d 排完之后得到一个"访问顺序表"：
#@d
#@d   table = [3, 0, 4, 1, 2]
#@d   意思是"第 1 小的元素在下标 3、第 2 小的在下标 0……"
#@d
#@d **需要的时候按 table 的顺序去访问就行了，元素本身一个都没动。**
#@d
#@d ============ 基数排序的两个关键参数 ============
#@d
#@d   **基数 r**：每一位有多少种取值。十进制就是 10。
#@d   **位数 d**：最大数有多少位。最大 9999 就是 4 位。
#@d
#@d 复杂度是 **O(d(n + r))**。
#@d
#@d 注意它**和 n log n 无关** —— 只要 d 是常数，它就是**线性**的。
#@d 这就是"绕开比较排序下限"的办法：它压根不比较。
#@d
#@d ============ 这段 Python 和 C 有什么不一样 ============
#@d
#@d   C 用 typedef 给 int 起了个名字叫 ElementType，Python 没有 typedef，
#@d   直接写 ElementType = int 就行，就是个普通变量，留着是为了和 C 版对得上。
#@d
#@d   C 的 #define RADIX 10 是编译前把代码里的 RADIX 全替换成 10；
#@d   Python 就是一句 RADIX = 10，用起来一模一样，也是照着 C 版留着。
#@d
#@d   C 里 int i, j; 那种提前声明 Python 不需要，所以只留下注释。
#@d   C 还 #include 了 stdio.h / stdlib.h，Python 的 print 是自带的，
#@d   不用 include 任何东西。

#@s 元素类型
ElementType = int

#@s 基数：十进制数每一位有 10 种可能（0~9）
RADIX = 10

#@s 最大位数：本节的测试数据最大 9999，所以是 4 位
MAXD = 4

#@s 数组的最大长度（桶要用）
MAXN = 100

#@s 状态码
OK = 1
ERROR = 0
#@d C 的 typedef int Status; 是给返回类型起个别名，Python 不看类型，
#@d 这里照样留一个 Status = int，为的是和 C 版一行行对得上。
Status = int
#%end

#%module | 02 | TableSort | TableSort —— 表排序 | 3 | 01 |
#%summary | 只排下标数组，元素一个都不搬。
#@d ============ 核心思路 ============
#@d
#@d 排序的对象从"元素数组"换成了"下标数组"。
#@d
#@d 比较的时候，不再是比 A[j-1] 和 A[tmp]，
#@d 而是比 **A[table[j-1]] 和 A[table[i]]** —— 绕一层下标去看元素。
#@d
#@d 搬动的时候，搬的是 **table 里的下标**，不是元素本身。
#@d
#@d 所以整个算法只需要改两处：
#@d
#@d   比较处：加一层 table 间接访问
#@d   搬动处：搬 table 而不是搬 A
#@d
#@d 本模块用的是插入排序的框架（因为它最简单、也最适合"搬动很少"的场景）。
#@d 换成别的排序算法也一样，只要记住"比较和搬动都要通过 table"。
#@d
#@d ============ 一个容易搞混的地方 ============
#@d
#@d 排序的**目标**是 table 变成"按元素大小排列的下标序列"。
#@d
#@d 比如 A = { 30, 10, 40, 20 }：
#@d
#@d   最小的 10 在下标 1，然后是 20 在下标 3、30 在下标 0、40 在下标 2
#@d
#@d   所以排完之后 table = { 1, 3, 0, 2 }
#@d
#@d 读的时候：A[table[0]] = A[1] = 10，A[table[1]] = A[3] = 20…… 依次递增。
#@d
#@d ============ 这段 Python 和 C 有什么不一样 ============
#@d
#@d   传进来的 table 在 C 里是个数组（实际是指针），Python 就是个列表。
#@d   函数里写 table[i] = ...，外面那个列表立刻就变了，不用返回。
#@d
#@d   C 要开 int table[5] 这么大的数组，Python 现在不用了，空列表 [] 就行，
#@d   往里加元素用 append，长度它自己会涨。
#@d
#@d   内层循环 C 是 for (j = i; j > 0 && A[table[j-1]] > A[tmp]; j--)，
#@d   中间那个条件带着数组比较，Python 的 for 塞不进去，改成 while 自己减 j。

#@s 表排序：把"访问顺序"排进 table，A 本身不动
def TableSort(A, N, table):
    #@s 循环用
    #@s 临时存一个下标
    #@d C 里这两行是 int i, j; 和 int tmp; 的声明，
    #@d Python 不用提前声明变量，所以这里只留下说明。
    #@d i 交给 for 循环自己生成，下面还剩一个 j 要自己维护。

    #@s 初始化：一开始"第 i 小的就是第 i 个"
    #@d C 是 for (i = 0; i < N; i++) table[i] = i; 手动填一遍。
    #@d Python 有现成的写法，range(N) 直接生成 0, 1, 2, … N-1，
    #@d list(...) 一包就是 [0, 1, 2, …]，和 C 那个循环填出来的一模一样。
    #@d 这里先清空是因为 table 是外面传进来的同一个列表，不能重新绑定名字。
    table.clear()
    table.extend(list(range(N)))

    #@s 用插入排序的框架，对 table 排序
    for i in range(1, N):
        #@s 取出当前下标
        tmp = table[i]

        #@s 比较时套一层 table —— 注意这里是 A[table[j-1]] 和 A[tmp]
        #@d tmp 本身就是一个下标，所以直接 A[tmp] 就是它指向的元素。
        #@d C 的 j-- 写在 for 的第三段里自动走，Python 的 while 得自己减。
        j = i
        while j > 0 and A[table[j - 1]] > A[tmp]:
            #@s 搬动的是下标，不是元素
            table[j] = table[j - 1]
            j -= 1

        #@s 下标落位
        table[j] = tmp
#%end

#%module | 03 | Rearrange | Rearrange —— 按表重排（环移动） | 3 | 01,02 |
#%summary | 如果确实需要元素本身也有序，就按 table 指出的"环"来搬。
#@d ============ 为什么要"重排" ============
#@d
#@d 表排序的好处是"不动元素"。但有时候下游代码就是要一个物理有序的数组
#@d （比如要传给一个不知道 table 的库函数），那就得真搬。
#@d
#@d 这时候有个讲究：**不能简单地按 table 一个个搬过去**，那样需要一个
#@d 同等大小的临时数组。而"环移动"可以**原地完成**，只用 O(1) 的额外空间。
#@d
#@d ============ 什么是"环" ============
#@d
#@d 把 table 看成一个置换：table[i] 表示"位置 i 应该放原来第 table[i] 个元素"。
#@d
#@d 拿 A = { 30, 10, 40, 20 }（table = { 1, 3, 0, 2 }）举例：
#@d
#@d   位置 0 要放原来下标 1 的（10）
#@d   位置 1 要放原来下标 3 的（20）
#@d   位置 3 要放原来下标 2 的（40）
#@d   位置 2 要放原来下标 0 的（30）
#@d
#@d 追着看：0 → 1 → 3 → 2 → 0，**绕回了起点** —— 这是一个 4 个元素的环。
#@d
#@d 另一个例子 table = { 0, 2, 1 }：
#@d
#@d   位置 0 已经对了（table[0] = 0），不动
#@d   位置 1 ↔ 位置 2 互换，这是一个 2 个元素的环
#@d
#@d 做法就是：**沿着环一个个搬，最后把空出来的位置填上**。
#@d 每处理完一个环，这些位置就都到位了，后面不用再看。
#@d
#@d ============ 复杂度 ============
#@d
#@d 每个元素最多被搬一次（每个环里的元素只走一遍），所以是 **O(n)**。
#@d
#@d 比"另开一个数组再拷回来"省了 O(n) 的空间。
#@d
#@d ============ 这段 Python 和 C 有什么不一样 ============
#@d
#@d   C 的 next 是提前 int next; 声明好的，Python 第一次赋值的时候就冒出来了，
#@d   所以函数开头那个声明只剩注释。
#@d
#@d   C 有 ++ / -- 这种运算符，Python 没有，自增自减一律写成 k += 1、
#@d   k -= 1 这种形式，别的都一样。
#@d
#@d   整体是"照着 C 一行行抄下来"的，连 tmp、next 这些变量名都保留了 ——
#@d   因为这段的重点就是看清楚环是怎么绕回来的，名字换了就不好对。
#@d   A 和 table 都是列表，函数里改完外面立刻能看到，压根不用指针。

#@s 按 table 把 A 重排成物理有序（原地，用环移动）
#@d 注意：执行后 table 会被破坏成"已经是单位置换"的状态
def Rearrange(A, N, table):
    #@s 循环用
    #@s 暂存元素
    #@d C 里这里是 int i, k, next; 和 ElementType tmp; 两句声明，
    #@d Python 不用声明，i 交给 for，k / next / tmp 用到就赋值。

    for i in range(N):
        #@s table[i] == i 说明这个位置已经对了，跳过
        if table[i] != i:
            #@s 把位置 i 的元素先抱出来——它要搬到别处去
            tmp = A[i]
            k = i

            #@s 沿着环往前推，直到绕回起点
            while table[k] != i:
                #@s 把"应该放到 k 位置"的那个元素搬过来
                A[k] = A[table[k]]

                #@s 记住当前位置，然后跳到下一个
                next = k
                k = table[k]

                #@s 这个位置处理完了，标记成"已就位"
                table[next] = next

            #@s 环绕回来了，把最开始抱出来的元素放进空位
            A[k] = tmp
            table[k] = k
#%end

#%module | 04 | GetDigit | GetDigit —— 取某一位上的数字 | 2 | 01 |
#%summary | 取第 d 位（d=1 是个位）。
#@d ============ 怎么取出第 d 位 ============
#@d
#@d 两步：
#@d
#@d   ① **先除掉低位**：x /= 10 做 d-1 次，把要的那一位挪到个位
#@d   ② **再取个位**：x % 10
#@d
#@d 举例，取 1234 的第 2 位：
#@d
#@d   除以 10 一次 → 123
#@d   123 % 10 → 3      ✓
#@d
#@d ============ 为什么基数排序要用它 ============
#@d
#@d 基数排序每一轮只看"某一位"。第 1 轮看个位、第 2 轮看十位……
#@d
#@d 所以需要频繁回答"这个数的第 d 位是几"，GetDigit 就是干这个的。
#@d
#@d ============ 这段 Python 和 C 有什么不一样 ============
#@d
#@d   C 的 x /= 10 对整数来说是整除，小数部分直接丢掉；
#@d   Python 的 / 会算成 123.4 这种小数，拿去 % 10 结果就不对了，
#@d   所以必须写 //（整除），得数和 C 一模一样。
#@d
#@d   C 把取个位写成 x % RADIX，Python 也是 x % RADIX，一个字没改。
#@d
#@d   函数开头那句 int i; 的声明没有了，i 交给 for 循环自己生成。

#@s 取非负整数 x 的第 d 位（d 从 1 开始，d=1 是个位）
def GetDigit(x, d):
    #@s 循环用

    #@s 先把低 d-1 位除掉
    #@d C 是 for (i = 1; i < d; i++)，i 从 1 走到 d-1，一共除 d-1 次；
    #@d Python 的 range(1, d) 一模一样，也是 1 到 d-1，一次不多一次不少。
    for i in range(1, d):
        x //= 10

    #@s 取个位
    return x % RADIX
#%end

#%module | 05 | RadixSort | RadixSort —— 基数排序（LSD） | 3 | 01,04 |
#%summary | 按个位、十位、百位逐轮「分配-收集」，全程不比较。
#@d ============ 一轮"分配-收集"在做什么 ============
#@d
#@d   ① **分配**：按当前位上的数字，把每个元素扔进对应的桶
#@d              （0~9 一共 10 个桶）
#@d   ② **收集**：按桶号从 0 到 9，把桶里的元素依次取回来
#@d
#@d 走一遍 { 1234, 0005, 0021, 0000 }（按 4 位看）：
#@d
#@d   **第 1 轮（个位）**：
#@d     4 进 4 号桶、5 进 5 号桶、1 进 1 号桶、0 进 0 号桶
#@d     收集：0 号桶的 0000 → 1 号桶的 0021 → 4 号桶的 1234 → 5 号桶的 0005
#@d     结果：0000, 0021, 1234, 0005
#@d
#@d   **第 2 轮（十位）**：
#@d     0000 的十位是 0 → 0 号桶
#@d     0021 的十位是 2 → 2 号桶
#@d     1234 的十位是 3 → 3 号桶
#@d     0005 的十位是 0 → 0 号桶
#@d
#@d     收集 0 号桶：[0000, 0005]（注意顺序！）→ 2 号桶、3 号桶
#@d     结果：0000, 0005, 0021, 1234
#@d
#@d   继续做百位、千位…… 最后就是完全有序的
#@d
#@d ============ 为什么"低位优先"（LSD）能对 ============
#@d
#@d 这是最反直觉的地方：先按个位排，后面按十位百位排的时候，
#@d 个位的顺序**不会被打乱吗**？
#@d
#@d 不会，**前提是每一轮都是稳定的**。
#@d
#@d 想一下第 3 轮（百位）做完之后是什么状态：
#@d
#@d   所有元素按百位分好了组，而**每组内部**的顺序，
#@d   是上一轮（十位）做完时的顺序 —— 也就是"按十位有序"。
#@d
#@d   而十位有序的组内部，又是"按个位有序"的。
#@d
#@d 所以三轮做完之后：**先按百位、百位相同再看十位、十位相同再看个位** ——
#@d 这正是"从高位到低位逐个比较"的效果，也就是完全有序。
#@d
#@d 一句话：**LSD 的正确性完全建立在"每一轮都是稳定排序"之上。**
#@d
#@d 而"分配-收集"这个动作恰好是稳定的：
#@d 同一个桶里，先进去的先被取出来。所以顺序不会乱。
#@d
#@d ============ 复杂度 ============
#@d
#@d 每轮做 n 次分配 + n 次收集，共 d 轮，所以是 **O(d(n + r))**。
#@d
#@d 只要最大位数 d 是常数（比如都是 4 位数），它就是**线性**的。
#@d 这是"绕开比较排序 O(n log n) 下限"的经典办法。
#@d
#@d ============ 这段 Python 和 C 有什么不一样 ============
#@d
#@d   C 的桶是 ElementType buckets[RADIX][MAXN]; 开了一块 10 × 100 的固定
#@d   空间，里面是上一次跑剩的垃圾值。Python 写成嵌套列表推导
#@d   [[0] * MAXN for _ in range(RADIX)]，也是 10 × 100，用起来一模一样 ——
#@d   注意别写成 [[0] * MAXN] * RADIX，那样 10 行指向的是同一个列表，
#@d   往一个桶里放东西，10 个桶会一起变，这是 Python 特有的坑。
#@d
#@d   C 里的 malloc/free 是拿来给链表结点申请和释放内存的。这一版用的是
#@d   二维数组当桶，本来就没有 malloc，也就没有 free。Python 更省事：
#@d   内存全归垃圾回收管，你只管建对象，什么时候还回去不用你操心。
#@d
#@d   C 的 count[di]++ 是"先用当前值当下标，再加一"，Python 没有 ++，
#@d   拆成 buckets[di][count[di]] = A[i] 和 count[di] += 1 两句，
#@d   顺序一样：先按现在这个计数放进去，再往上加。稳定就靠这个顺序。
#@d
#@d   C 的 tmp[pos++] = buckets[i][j] 同样拆成两句：先 tmp[pos] = ...，
#@d   再 pos += 1。整段除了这两个 ++ 和数组的开法，其余一行没改。

#@s 基数排序（低位优先）
def RadixSort(A, N):
    #@s 桶：buckets[桶号][桶内位置]
    #@d 用二维数组当桶最直观。缺点是空间是 r × n，比较浪费。
    buckets = [[0] * MAXN for _ in range(RADIX)]
    #@s 每个桶里现在有多少个元素
    count = [0] * RADIX
    #@s 收集结果
    tmp = [0] * MAXN
    #@s 第几轮（也就是第几位）
    #@s 循环用
    #@s 当前元素应该进哪个桶
    #@s 收集时的写入位置
    #@d C 里这一串是 int d; int i, j; int di; int pos; 几句声明，
    #@d Python 不用声明，d 和 i 交给 for，di 和 pos 用到就赋值。

    #@s 一共做 MAXD 轮：个位、十位、百位、千位
    #@d C 是 for (d = 1; d <= MAXD; d++)，Python 写 range(1, MAXD + 1)，
    #@d d 一样从 1 取到 4，四轮一次不少。
    for d in range(1, MAXD + 1):
        #@s ① 清空所有桶的计数
        for i in range(RADIX):
            count[i] = 0

        #@s ② 分配：按第 d 位把元素扔进桶里
        for i in range(N):
            #@s 取第 d 位
            di = GetDigit(A[i], d)
            #@s 放进对应的桶，桶计数加一
            #@d `count[di]++` 是先用当前值当位置，再加一 —— 这就是"先进先出"的保证。
            #@d Python 没有 ++，所以拆成两句。位置必须先用旧值，顺序不能换。
            buckets[di][count[di]] = A[i]
            count[di] += 1

        #@s ③ 收集：按桶号 0~9，把每个桶里的元素依次取回来
        pos = 0
        for i in range(RADIX):
            for j in range(count[i]):
                #@s 从桶里取元素 —— 同桶内是先进先出，所以这一轮是稳定的
                #@d C 的 tmp[pos++] 也是两步：先写进去，再往后挪一格。
                tmp[pos] = buckets[i][j]
                pos += 1

        #@s ④ 把这一轮的结果写回原数组，供下一轮使用
        for i in range(N):
            A[i] = tmp[i]
#%end

#%module | 06 | PrintArray | PrintArray —— 打印与检查 | 1 | 01 |
#%summary | 打印数组、检查有序、按 table 打印。
#@d 表排序有个特殊的输出方式：既打印元素本身，也打印 table 指出的顺序。
#@d 因为"表排序之后数组是乱的，但按 table 读是有序的" —— 这一点必须看清楚。
#@d
#@d ============ 这段 Python 和 C 有什么不一样 ============
#@d
#@d   C 的 printf 打完不换行，Python 的 print 每打一次自己补一个换行，
#@d   所以不想换行的地方统统要加 end=''（打完什么都不接）。
#@d   刚到 Python 的人十有八九会忘，然后输出变成一列。
#@d
#@d   C 用 printf("%d, ") 打元素加分隔，Python 写 print(A[i], end=', ')
#@d   效果一模一样。C 那个 if (i < N - 1) 的两行大括号，Python 一个冒号
#@d   加缩进就顶了，最后一个元素后面照样不多不少一个逗号。
#@d
#@d   C 的 IsSorted 返回 int，0 表示乱、1 表示有序；Python 里更常见的是
#@d   返回 True / False，这里特意留着 0 和 1，为的是和 C 版对得上。
#@d
#@d   PrintByTable 里绕一层 table 去看元素，两边写法完全一样：A[table[i]]。
#@d   列表套列表地取值，Python 和 C 的下标用法没区别。

#@s 打印数组
def PrintArray(A, N):
    #@s 循环用
    print('[', end='')
    for i in range(N):
        print(A[i], end='')
        if i < N - 1:
            print(', ', end='')
    print(']', end='')

#@s 检查是否有序
def IsSorted(A, N):
    #@s 循环用
    #@d C 的条件是 i + 1 < N，Python 写成 range(N - 1)，
    #@d i 一样是从 0 走到 N-2，最后那次比较 A[N-2] 和 A[N-1] 一次不落。
    for i in range(N - 1):
        if A[i] > A[i + 1]:
            return 0
    return 1

#@s 按 table 给出的顺序打印元素
#@d 这是表排序的正确读法：数组本身乱着，但按 table 读出来是有序的。
def PrintByTable(A, table, N):
    #@s 循环用
    print('[', end='')
    for i in range(N):
        #@s 绕一层 table 去访问元素
        print(A[table[i]], end='')
        if i < N - 1:
            print(', ', end='')
    print(']', end='')

#@s 检查"按 table 读出来"是不是有序
def IsSortedByTable(A, table, N):
    #@s 循环用
    for i in range(N - 1):
        if A[table[i]] > A[table[i + 1]]:
            return 0
    return 1
#%end

#%module | 07 | main | main —— 两个算法各跑一遍 | 3 | 01,02,03,04,05,06 |
#%summary | 表排序看"元素没动但访问有序"，基数排序看"逐位分配收集"。
#@d ============ 怎么看这两个算法 ============
#@d
#@d **表排序**的重点是：跑完之后 `A` 本身还是乱的，但 `A[table[0]]`、
#@d `A[table[1]]`…… 读出来是有序的。这就是"间接排序"。
#@d
#@d **基数排序**的重点是：整个过程一次比较都没有，只有"取某一位"和
#@d "分桶收集"。所以它的复杂度里没有 log n。
#@d
#@d ============ 这段 Python 和 C 有什么不一样 ============
#@d
#@d   C 的 int main(void) 是程序运行时自己去调的入口，Python 没有这回事，
#@d   惯例写成 if __name__ == '__main__':，
#@d   意思是"直接运行这个文件才执行，被别的文件 import 进来时不执行"。
#@d
#@d   C 的 ElementType a[] = { 30, 10, 40, 20, 50 }; 要先说类型再说长度，
#@d   Python 直接 a = [30, 10, 40, 20, 50] 一行就完事，长度也不用另说。
#@d
#@d   C 的 int table[5]; 是"先开五个格子空着"，Python 这边给个空列表 []
#@d   就行，TableSort 里的 extend(range(N)) 会把它撑到 5 个，
#@d   所以后面 table[i] 照样能用，得数一模一样。
#@d
#@d   C 的 printf("...%d...\n", x) 在这儿写成 f'...{x}...'（字符串前面带 f，
#@d   花括号里直接填变量或者式子），打出来的字一模一样。
#@d   但要注意 print(a, b) 中间会自动塞一个空格，而 printf 不会 ——
#@d   所以能用一条 f-string 拼完的就别拆成两个参数。
#@d
#@d   C 的 printf("  %s\n", ...) 末尾是一个换行，Python 的 print 自己带一个，
#@d   所以字符串里再补一个 '\n' 才凑够两个。
#@d
#@d   C 里套了一层 { } 是为了让 c、count、buckets 这些名字只在那段里有效，
#@d   Python 没有这种花括号作用域，所以那对括号没有了，代码直接往下写。
#@d   注意 outside 的 count、buckets 和 RadixSort 里面的是各写各的，
#@d   互不影响，因为 Python 的局部变量是函数自己的。
#@d
#@d   C 最后要 return 0; 告诉系统"正常结束"；Python 脚本跑到最后一行就自己
#@d   结束了，所以那一句没有了。

#@s 主函数
if __name__ == '__main__':
    #@s 表排序的测试数据
    a = [30, 10, 40, 20, 50]
    #@s table
    table = []
    #@s 基数排序的测试数据
    b = [1234, 5, 21, 0, 99, 1000, 7, 456]
    #@s 长度
    nb = 8
    #@s 循环用
    #@d C 里这句是 int i; 的声明，Python 用 for i in range(...) 生成，
    #@d 所以这里只留下注释。

    #@s ===== 表排序 =====
    print('=== 表排序 ===')
    print('原始 A: ', end='')
    PrintArray(a, 5)
    print('\n')

    TableSort(a, 5, table)

    print('排完之后 A 本身: ', end='')
    PrintArray(a, 5)
    print('   ← 一个都没动！')
    print('table:           [', end='')
    for i in range(5):
        #@d C 是 printf("%d%s", table[i], i < 4 ? ", " : "")，
        #@d 数和分隔符一次打完。Python 没有 ?: 这个写法，
        #@d 写成条件表达式 'if ... else' 更顺眼，打出来的字完全一样。
        print(f'{table[i]}' + (', ' if i < 4 else ''), end='')
    print(']')
    print('按 table 读 A:   ', end='')
    PrintByTable(a, table, 5)
    print('   ← 有序了')
    #@d C 写 printf("...%s\n\n", ... ? "是" : "不是")，末尾两个换行；
    #@d Python 的 print 自己带一个，所以字符串里补一个 '\n' 正好凑够两个。
    print('按 table 读是有序: ' + ('是' if IsSortedByTable(a, table, 5) else '不是') + '\n')

    #@s 环重排
    print('--- 如果需要元素本身也有序，就做环重排 ---')
    print('重排前 A: ', end='')
    PrintArray(a, 5)
    print()
    Rearrange(a, 5, table)
    print('重排后 A: ', end='')
    PrintArray(a, 5)
    print('   ' + ('有序 ✓' if IsSorted(a, 5) else '还是乱的 ✗'))
    print('（环移动是原地完成的，不需要额外数组）\n')

    #@s ===== 基数排序 =====
    print('=== 基数排序 ===')
    print('原始: ', end='')
    PrintArray(b, nb)
    print()
    print('（最大 4 位数，所以做 4 轮：个位 → 十位 → 百位 → 千位）\n')

    #@s 手工演示前两轮
    c = [0] * MAXN
    count = [0] * RADIX
    buckets = [[0] * MAXN for _ in range(RADIX)]
    tmp = [0] * MAXN

    for i in range(nb):
        c[i] = b[i]

    for d in range(1, 3):
        for i in range(RADIX):
            count[i] = 0
        for i in range(nb):
            di = GetDigit(c[i], d)
            buckets[di][count[di]] = c[i]
            count[di] += 1
        pos = 0
        for i in range(RADIX):
            for j in range(count[i]):
                #@d C 的 tmp[pos++] 拆两句，和 RadixSort 里写的一样。
                tmp[pos] = buckets[i][j]
                pos += 1
        for i in range(nb):
            c[i] = tmp[i]

        #@d C 是 for (d = 1; d <= 2; d++)，Python 写 range(1, 3) —— 取 1 和 2，
        #@d 正好也是前两轮，不多不少。
        print('第 ' + str(d) + ' 轮（看' + ('个' if d == 1 else '十') + '位）之后: ', end='')
        PrintArray(c, nb)
        print()
    print()

    #@s 完整跑一遍
    RadixSort(b, nb)
    print('排完: ', end='')
    PrintArray(b, nb)
    print('   ' + ('有序 ✓' if IsSorted(b, nb) else '还是乱的 ✗'))

    #@s 总结
    print('\n=== 两个算法的共同点：绕开 O(n log n) ===')
    print('  表排序  ：比较的本质没变，但「搬动」的代价从几百字节降到 4 字节')
    print('  基数排序：**完全不比较**，靠逐位分桶，O(d(n+r))')
    print('\n基数排序为什么是对的？因为「分配-收集」是稳定的，')
    print('所以低位排好的顺序在高位相同时不会被打乱。')
    print('（这也是它必须用稳定排序的原因）')

    #@s 正常结束
    #@d C 里最后是 return 0;（表示正常退出），Python 没有这一步，
    #@d 脚本走到最后一行就自己结束了。真要表示"出错退出"才需要 sys.exit(1)。
#%end
