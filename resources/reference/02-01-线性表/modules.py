#%module | 01 | typedef | 头文件与 typedef | 1 |
#%summary | 顺序表 = 一段连续内存 + 一个 length。
#@d ============ 顺序表长什么样 ============
#@d
#@d   下标   0    1    2    3    4    5
#@d        ┌────┬────┬────┬────┬────┐
#@d   data │ 10 │ 20 │ 30 │    │    │
#@d        └────┴────┴────┴────┴────┘
#@d   length = 3
#@d
#@d 两个关键点：
#@d
#@d   1. 元素挨着放 —— 所以能"按下标随机访问"。想拿第 3 个，直接 data[2]，
#@d      一步到位，不需要从头数。这是链表做不到的（链表得走 3 步）。
#@d
#@d   2. length 记录**实际有几个元素**，它和 MAXSIZE（**最多能放几个**）
#@d      完全是两回事。表里只有 3 个元素，但开了 100 个格子 ——
#@d      后面那些格子里的内容是空的，永远不要去看它们。
#@d
#@d ============ C 和 Python 在这里最大的差别 ============
#@d
#@d   C 里要先声明"这个数组有多长"（MAXSIZE），而且要自己记住 length。
#@d   Python 的 list 长度是自动的，len(L.data) 就是元素个数，
#@d   不需要单独一个 length 字段，也不用手动 +1 -1。
#@d
#@d   但"表满不能插"这件事 Python 也有：list 想多长就多长、放不下会自己扩容，
#@d   所以下面保留 MAXSIZE 检查是为了跟教材对上，不是 Python 必须的。

#@s 最多能放多少个元素，为了和教材对上才保留
MAXSIZE = 100

#@s 函数返回状态：OK 表示成功，ERROR 表示失败
#@d C 里用 #define 宏，Python 直接用两个常量
OK = 1
ERROR = 0

#@s 顺序表 = 一个列表 + 当前长度
#@d Python 用 class 代替 C 的 struct，
#@d 因为 C 的函数要手写 (SeqList *L)，Python 的方法自带 self。
#@d self.length 相当于 C 里的 L->length。
class SeqList:
#@s 只在这里初始化两个字段，和数据无关的东西一概不放
    def __init__(self):
#@s 连续内存，元素一个挨一个
        self.data = [None] * MAXSIZE
#@s 当前实际元素个数
        self.length = 0
#%end

#%module | 03 | ListInsert_Sq | ListInsert_Sq —— 插入 | 2 | 01,02 |
#%summary | 先把第 i 个及以后的元素统统后移一位，腾出空位再填进去。
#@d ============ 插入要"搬家" ============
#@d 在位置 i 插入 e，意味着 e 要占住下标 i-1 那个格子。
#@d 但那个格子原本有元素，所以它以及它后面所有的元素都得往后挪一格：
#@d
#@d   插入前： 10  20  30  _   _        （length = 3，在下标 1 处插入 15）
#@d             0   1   2   3   4
#@d
#@d   后移：   10  20  __  30  _        ← 30 从下标 2 挪到 3
#@d                └── 20 从下标 1 挪到 2
#@d
#@d   填入：   10  15  20  30  _        ← e 放进腾出来的下标 1
#@d   length = 4
#@d
#@d ============ 为什么必须从后往前搬 ============
#@d
#@d   正确（j 从 length 递减到 i）：先搬最右边的，空位一路向左让出来
#@d       data[3] = data[2]   →  data[2] = data[1]   →  data[1] = e
#@d
#@d   错误（j 从 i 递增到 length）：先搬左边的，会把右边的值覆盖掉
#@d       data[1] = data[0]   →  data[2] = data[1]   ← 这里 data[1] 已经是 10 了！
#@d
#@d 一句话记住：**搬家永远从"没人占的那一头"开始搬**。
#@d
#@d ============ 这段 Python 和 C 只有一个地方不一样 ============
#@d
#@d   C 的 for 是 j--，从 length 递减到 i：
#@d       for (j = L->length; j >= i; j--)
#@d
#@d   Python 的 range 不包含右端点，所以要写成 range(length, i-1, -1)。
#@d   第三个参数 -1 才是"递减"，这是初学 Python 最容易漏的地方。

#@s 写在 class 里面，所以要缩进一层；self 就是 C 里的那个 L
    #@s i 是插入位置（1 基，不是下标），e 是待插入元素
    def ListInsert_Sq(self, i, e):
        #@s 位置合法性：1 到 length+1 都算合法
        #@d 为什么是 length+1？因为"插在最后一个元素后面"是允许的。
        #@d 长度为 3 时，合法位置是 1、2、3、4；i=5 就越界了。
        #@d 注意这里用的是 length 而不是 MAXSIZE —— 前者是"有几个元素"，
        #@d 后者是"能装几个"，判断位置用前者。
        if i < 1 or i > self.length + 1:
            #@s 位置不合法，直接返回失败
            return ERROR

        #@s 表满了也插不进去
        #@d 这是顺序表天生的局限：容量是固定的，满了只能报错（或者扩容搬迁）。
        #@d 链表没有这个问题 —— 内存够就能一直加。
        if self.length >= MAXSIZE:
            #@s 满了也返回失败
            return ERROR

        #@s 从最后一个元素开始，一个个往后挪一格
        #@d j 从 length 递减到 i：注意 data[length] 这个格子本身是"空"的
        #@d （不在 length 计数范围内），所以第一次赋值刚好把最后那个元素挪进空位。
        #@d 循环结束时，下标 i-1 那个格子已经被腾出来了。
        #@d
        #@d range(self.length, i - 1, -1) 生成的序列是 length, length-1, ..., i，
        #@d 正好和 C 的 j >= i 一样，到 i 就停，不会多搬一次。
        for j in range(self.length, i - 1, -1):
            #@s 把前一个元素搬到后一个格子
            self.data[j] = self.data[j - 1]

        #@s 把 e 填进腾出来的空位
        #@d 存的是下标，所以位置 i 对应 data[i-1]。这个 ±1 的转换是初学时
        #@d 最容易写错的地方，建议在纸上画一遍。
        self.data[i - 1] = e

        #@s 元素多了一个
        self.length += 1

        #@s 插入成功
        return OK
#%end
