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
#@d
#@d   C 用 struct + 一堆独立的函数，Python 用 class + 方法：
#@d   C 的函数要手写 (SeqList *L)，Python 的方法自带 self。
#@d   self.length 相当于 C 里的 L->length。

#@s 最多能放多少个元素，为了和教材对上才保留
MAXSIZE = 100

#@s 函数返回状态：OK 表示成功，ERROR 表示失败
#@d C 里用 #define 宏，Python 直接用两个常量
OK = 1
ERROR = 0

#@s 顺序表 = 一个列表 + 当前长度
class SeqList:
    #@s 只在这里初始化两个字段，和数据无关的东西一概不放
    def __init__(self):
        #@s 连续内存，元素一个挨一个
        self.data = [None] * MAXSIZE
        #@s 当前实际元素个数
        self.length = 0
#%end

#%module | 02 | InitList_Sq | InitList_Sq —— 初始化 | 1 | 01 |
#%summary | 只把 length 置 0 —— 一格内存都不用清。
#@d ============ 为什么不需要清空数组 ============
#@d
#@d 新手常写一个循环把 data[0..MAXSIZE-1] 全赋 0，其实完全没必要。
#@d
#@d 因为"表里有几个元素"是 **length 说了算**，而不是数组里有没有值。
#@d length = 0 就意味着"这是张空表"，后面格子里的垃圾值谁也看不见。
#@d
#@d 反过来，如果只清了数组却忘了 length = 0，那才是真的错。
#@d
#@d ============ 和 C 的差别 ============
#@d
#@d   C 里要写成 InitList_Sq(SeqList *L)，然后改 L->length。
#@d   传指针是因为"初始化"要改调用者手里那张表本身；
#@d   传值的话改的是副本，调用者那边毫无变化 —— 这是个高频错误。
#@d
#@d   Python 里对象本来就是按引用传的，改 self.length 就是改那个对象本身，
#@d   不存在"忘了加 &"这种错。这是 Python 帮我们挡掉的一类坑。

    #@s 空表：一个元素都没有 —— 这一句就够了
    def InitList_Sq(self):
        self.length = 0
        #@s 约定：返回 OK 表示初始化成功
        return OK
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

#%module | 04 | ListDelete_Sq | ListDelete_Sq —— 删除 | 2 | 01,02 |
#%summary | 把第 i 个元素取走后，后面的元素统统前移一位把空位填上。
#@d ============ 删除也要"搬家"，方向相反 ============
#@d
#@d   删除前： 10  15  20  30  _        （length = 4，删除下标 1 的 15）
#@d             0   1   2   3   4
#@d
#@d   前移：   10  20  30  __  _        ← 20 从下标 2 挪到 1，30 从 3 挪到 2
#@d   length = 3
#@d
#@d 和插入正好相反：**删除要从前往后搬**。
#@d 因为这次空位在左边，得让右边的元素一个个往左填。
#@d 如果从后往前搬，就会把还没搬的元素覆盖掉。
#@d
#@d ============ 和 C 最大的差别：出口参数没了 ============
#@d
#@d   C 里第三个参数是 ElemType *e，一个"出口参数"——
#@d   函数没法返回两个值，所以把被删的元素通过指针写回调用者。
#@d
#@d   Python 可以直接返回两个值：return OK, e。调用者写
#@d       r, val = L.ListDelete_Sq(2)
#@d   就同时拿到了状态和被删的元素。这是 Python 更顺手的地方。

    #@s 返回 (状态, 被删的元素)；失败时第二个值是 None
    def ListDelete_Sq(self, i):
        #@s 位置合法性：1 到 length
        #@d 注意和插入的区别：这里上限是 length 而不是 length+1。
        #@d 因为删除的是"已经存在的元素"，而长度为 3 的表里只存在 1、2、3 三个位置。
        if i < 1 or i > self.length:
            return ERROR, None

        #@s 先把被删元素取出来 —— 必须在搬家之前做
        #@d 因为它马上就要被后面的元素覆盖掉了，晚一步就取不到了。
        #@d 这里直接存进局部变量，最后一起返回，不用出口参数。
        e = self.data[i - 1]

        #@s 从被删位置开始，后面的元素统统往前挪一格
        #@d j 从 i 递增到 length-1：把 data[j] 搬到 data[j-1]。
        #@d range(i, self.length) 对应 C 的 j = i; j < length; j++。
        #@d 循环结束后，最后一个位置 data[length-1] 的内容虽然还在，
        #@d 但已经不在 length 计数范围内，等于被抛弃了。
        for j in range(i, self.length):
            self.data[j - 1] = self.data[j]

        #@s 元素少了一个
        self.length -= 1

        #@s 删除成功，把被删的元素一起带回去
        return OK, e
#%end

#%module | 05 | LocateElem_Sq | LocateElem_Sq —— 按值查找 | 1 | 01 |
#%summary | 从头挨个比，返回第一个相等元素的位序；找不到返回 0。
#@d ============ 顺序查找 ============
#@d
#@d   找 30： 10  20  30  40
#@d           ↑   ↑   ↑
#@d           比  比  中 ✓        比较 3 次
#@d
#@d 这叫"顺序查找"，平均要比较 (n+1)/2 次，时间复杂度 O(n)。
#@d
#@d 如果这张表是**有序的**，可以改用二分查找，降到 O(log n)。
#@d 但二分要求"能按下标跳跃访问"—— 这恰好是顺序表的强项，
#@d 链表就做不了（链表中途没法直接跳到中间）。
#@d
#@d ============ 这段 Python 几乎和 C 一模一样 ============
#@d
#@d   C 的写法：  for (i = 0; i < L.length; i++)
#@d   Python：    for i in range(self.length)
#@d
#@d   唯一的差别是 C 要自己声明 int i 并手动加一，
#@d   Python 的 range 直接把 0 到 length-1 生成出来，不用管计数器。

    #@s 返回"位序"（1 基），不是下标；找不到返回 0
    #@d 为什么返回位序而不是下标？因为调用者拿到 0 就知道"没找到"，
    #@d 而下标 0 是合法位置，用它当"没找到"会分不清。
    def LocateElem_Sq(self, e):
        #@s 从下标 0 扫到 length-1 —— 只扫"有效元素"那一段
        #@d 一定用 self.length 做上界，不要用 MAXSIZE：
        #@d 后面那些格子是垃圾值，扫进去可能"莫名奇妙找到"一个相等的东西。
        for i in range(self.length):
            #@s 相等就返回它的位序（下标 +1）
            if self.data[i] == e:
                return i + 1

        #@s 扫完了还没有，就是没有
        return 0
#%end

#%module | 06 | main | main —— 把顺序表跑一遍 | 1 | 01,02,03,04,05 |
#%summary | 插入、删除、查找各跑一次，每一步都打印出来对照。
#@d ============ 为什么要"一步一打印" ============
#@d
#@d 顺序表的 bug 大多不是崩溃，而是**悄悄出错**：
#@d 元素顺序错了、length 忘了加、搬家方向反了 —— 程序照跑不误，
#@d 只是数据不对。所以每一步都打印出来，肉眼一比对就露馅了。
#@d
#@d ============ C 的 main 在 Python 里长什么样 ============
#@d
#@d   C 的 int main(void) 是一个普通函数，由运行时自动调用。
#@d   Python 没有"自动调用入口函数"这回事，惯例是写成：
#@d
#@d       if __name__ == '__main__':
#@d           ...
#@d
#@d   意思是"这个文件被直接运行时才执行，被别人 import 时不执行"。
#@d   这一行是 Python 的固定写法，记住就行。

#@s 打印辅助函数：按顺序打印表里的每个元素
#@d C 里是循环 printf("%d ", ...)，每个数字后面都跟一个空格，包括最后一个。
#@d 所以行尾那个空格是 C 版的真实输出，这里照着做，
#@d 两种语言的输出才能逐字节相同，方便互相对照。
#@d （Python 更常见的写法是 ' '.join(...)，但那样行尾会少一个空格。）
def PrintList(tag, L):
    #@s 先把"表名 + 长度"打出来，末尾的空格和冒号跟 C 版一致
    arr = L.data[:L.length]
    print(f'{tag} length={L.length} : ', end='')
    #@s 逐个打印元素，每个后面跟一个空格 —— 和 C 的 printf("%d ") 一样
    for x in arr:
        print(x, end=' ')
    #@s 最后换行
    print()

#@s 主函数：Python 用 if __name__ 的固定写法代替 C 的 main
if __name__ == '__main__':
    #@s 定义一张表，并先初始化 —— 别忘了，否则 length 是上一次留下的
    L = SeqList()
    L.InitList_Sq()

    #@s 依次在表尾追加 10、20、40
    #@d 插到 length+1 的位置就是"追加到末尾"，每次只搬家 0 次，是最省的情形。
    L.ListInsert_Sq(1, 10)
    L.ListInsert_Sq(2, 20)
    L.ListInsert_Sq(3, 40)
    PrintList('追加 10 20 40 后:', L)

    #@s 在下标 2（位序 3）处插入 30，让表变成有序的
    #@d 这一次要搬家 1 个元素（40 后移），刚好演示"插入要挪位置"。
    L.ListInsert_Sq(3, 30)
    PrintList('在下标 2 处插入 30:', L)

    #@s 查找 30 在哪
    pos = L.LocateElem_Sq(30)
    print(f'查找 30 -> 位序 {pos}（下标 {pos - 1}）')

    #@s 查找一个不存在的值
    pos = L.LocateElem_Sq(99)
    print(f'查找 99 -> 位序 {pos}（0 表示没找到）')

    #@s 删除位序 2 的元素，看它是不是 20
    #@d 这次要搬家 2 个元素（30、40 前移），演示"删除要往前填"。
    r, deleted = L.ListDelete_Sq(2)
    print(f'删除位序 2 -> 拿到的元素是 {deleted}')
    PrintList('删除后:', L)

    #@s 越界插入应该被挡住
    if L.ListInsert_Sq(99, 7) == ERROR:
        print('在位序 99 插入 -> 被拒绝（越界）')
    PrintList('越界插入后:', L)
#%end
