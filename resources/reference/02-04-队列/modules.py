#%module | 01 | typedef | 头文件与 typedef | 1 |
#%summary | front 指队头、rear 指队尾的下一个位置，数组首尾相连成环。
#@d ============ 先看不用环会怎样（假溢出） ============
#@d
#@d 假设数组长度 5，一直"入队—出队"：
#@d
#@d   出队 3 次之后：
#@d        ┌────┬────┬────┬────┬────┐
#@d        │ __ │ __ │ __ │ 40 │ 50 │      front = 3, rear = 5
#@d        └────┴────┴────┴────┴────┘
#@d          ↑ 空着三个格子，但 rear 已经到头了
#@d
#@d 明明还有空间，却再也放不进新元素 —— 这就是**假溢出**。
#@d 真溢出是"数组真满了"，假溢出是"rear 撞墙了但前面空着"。
#@d
#@d ============ 用环解决 ============
#@d
#@d 让下标走到末尾之后回到 0：`(rear + 1) % MAXSIZE`
#@d
#@d        ┌────┬────┬────┬────┬────┐
#@d        │ 60 │ 70 │ __ │ 40 │ 50 │
#@d        └────┴────┴────┴────┴────┘
#@d                 ↑         ↑
#@d              rear = 2   front = 3
#@d
#@d 逻辑上是这样一圈（下标 0 紧接在 4 后面）：
#@d
#@d              0 ── 1 ── 2
#@d              │         │
#@d              4 ── 3 ───┘
#@d
#@d ============ 约定（务必记牢） ============
#@d
#@d   front 指向**队头元素本身**
#@d   rear  指向**队尾元素的下一个位置**（也就是下次入队该放哪）
#@d
#@d   front == rear                    →  队空
#@d   (rear + 1) % MAXSIZE == front    →  队满
#@d
#@d 注意队满的写法：它故意"浪费一个格子"，让队满和队空能区分开。
#@d 否则 front == rear 既可能是空也可能是满 —— 那就没法判断了。
#@d
#@d ============ 这段 Python 和 C 有什么不一样 ============
#@d
#@d   C 里 typedef struct { ... } Queue; 写了一大堆，Python 直接 class Queue
#@d   就完事了。data、front、rear 这三样东西照搬，一个字段都没少。
#@d
#@d   C 的 ElemType 是 int 的别名，Python 不用声明类型，想放啥放啥。
#@d   #define MAXSIZE 10 这种宏在 Python 里就是普通变量 MAXSIZE = 10。
#@d
#@d   还有个小地方：C 的数组写上 ElemType data[MAXSIZE] 就真的有 10 个格子，
#@d   里面是没初始化过的垃圾值；Python 用 [None] * MAXSIZE 先填 10 个 None，
#@d   这样没放元素的位置不会是"上辈子留下来的数"。

#@s 元素类型
ElemType = int

#@s 队列容量：实际最多只能放 MAXSIZE-1 个元素（为了区分空和满）
MAXSIZE = 10

#@s 状态码
OK = 1
ERROR = 0

#@s 返回值类型
Status = int

#@s 循环队列
class Queue:
    #@s 连续内存，当成环来用
    def __init__(self):
        self.data = [None] * MAXSIZE
        #@s 队头元素的下标
        self.front = 0
        #@s 队尾元素的下一个位置
        self.rear = 0
#%end

#%module | 02 | InitQueue | InitQueue —— 初始化 | 1 | 01 |
#%summary | front = rear = 0 —— 空队的标志就是两个指针重合。
#@d ============ 为什么空队是 front == rear ============
#@d
#@d 因为 rear 约定指向"队尾的下一个位置"。队里一个元素都没有时，
#@d 队头在 0，下一个可放的位置也是 0 —— 两个指针自然重合。
#@d
#@d 初始值取 0 而不是 -1，和栈不太一样。栈用 -1 是因为要让 top 指着一个
#@d 真实格子；队列这里两个指针都表示"位置"，从 0 起更顺。
#@d
#@d 从 0 起还有个好处：求元素个数时不用再加偏移，
#@d 直接用 (rear - front + MAXSIZE) % MAXSIZE 就够了。
#@d
#@d ============ 这段 Python 和 C 有什么不一样 ============
#@d
#@d   C 里参数写的是 Queue *Q，两个指针都要改，所以非得传指针不可；
#@d   Python 的方法自带 self，直接 self.front = 0 就改到对象自己身上了。
#@d
#@d   C 里 Q->front 那个箭头，在 Python 里就是 self.front 这个点。
#@d   换个写法而已，意思一模一样，也别再想"忘了写 & 怎么办"这种事了。

#@s 传指针：两个指针都要改
    def InitQueue(self):
        #@s 队头归零
        self.front = 0
        #@s 队尾归零 —— 与 front 重合即队空
        self.rear = 0
        #@s 成功
        return OK
#%end

#%module | 03 | EnQueue | EnQueue —— 入队 | 2 | 01,02 |
#%summary | 先判满，把元素放到 rear 处，再让 rear 绕环前进一格。
#@d ============ 入队 ============
#@d
#@d   入队前： 10  20  __  __  __      front = 0, rear = 2
#@d             0   1   2   3   4
#@d
#@d   ① data[rear] = 30   →  放进 2 号位
#@d   ② rear = (2+1) % 5 = 3
#@d
#@d   入队后： 10  20  30  __  __      front = 0, rear = 3
#@d
#@d 元素放在 rear 处而不是 rear+1 处 —— 因为 rear 自己就指着"下一个空位"。
#@d 这一点和栈的"先 top++ 再放"刚好相反，是两个最容易记混的地方：
#@d
#@d   栈  ：先动指针，再放数据（top 指栈顶元素）
#@d   队列：先放数据，再动指针（rear 指下一个空位）
#@d
#@d ============ 判满为什么是 (rear+1)%MAXSIZE == front ============
#@d
#@d 假如队里已满（真的把 MAXSIZE 个格子都用了），那么 rear 绕一圈后
#@d 会和 front 重合 —— 这时 front == rear，和"队空"撞车了。
#@d
#@d 所以干脆**主动牺牲一个格子**：当 rear 的下一格就是 front 时，就认定满了。
#@d 队列显示只能装 MAXSIZE-1 个元素，换来的是空/满一眼可辨。
#@d
#@d 代价就是一个格子的空间，非常划算。
#@d
#@d ============ 这段 Python 和 C 有什么不一样 ============
#@d
#@d   C 的 (Q->rear + 1) % MAXSIZE == Q->front，Python 写成
#@d   (self.rear + 1) % MAXSIZE == self.front —— 就是把箭头换成点，别的一个字没改。
#@d
#@d   取模这个运算是两边完全一样的行为：正数取模的时候，C 的 % 和 Python 的 %
#@d   结果相同，所以 rear 到头绕回 0 这件事一模一样。
#@d
#@d   C 里 e 是 ElemType（其实就是 int），Python 不写类型，
#@d   直接 self.data[self.rear] = e 就完事了。

#@s 入队
    def EnQueue(self, e):
        #@s 先判满 —— 注意是"下一格是否会撞上 front"
        if (self.rear + 1) % MAXSIZE == self.front:
            #@s 满了就拒绝
            return ERROR

        #@s 放入 rear 所指的空位
        self.data[self.rear] = e

        #@s rear 绕环前进一格（到头了就回到 0）
        #@d 这个 % MAXSIZE 就是"环"的全部实现。没有它，rear 会一直涨下去，
        #@d 很快越界 —— 而不取模导致的 bug 往往要到队列跑很多轮之后才暴露。
        self.rear = (self.rear + 1) % MAXSIZE

        #@s 成功
        return OK
#%end

#%module | 04 | DeQueue | DeQueue —— 出队 | 2 | 01,02 |
#%summary | 先判空，取走 data[front]，再让 front 绕环前进一格。
#@d ============ 出队 ============
#@d
#@d   出队前： 10  20  30  __  __      front = 0, rear = 3
#@d
#@d   ① e = data[0] = 10
#@d   ② front = (0+1) % 5 = 1
#@d
#@d   出队后： 10  20  30  __  __      front = 1, rear = 3
#@d             ↑
#@d        10 还在数组里，但已经不属于这张队列
#@d
#@d 和栈一样：**出队不擦数据，只是把 front 往前挪**。
#@d 空出来的格子不会被浪费 —— 等 rear 绕回来时会重新用它，
#@d 这正是循环队列比普通顺序队列强的地方。
#@d
#@d ============ 队空判断 ============
#@d front == rear 就是空。出队前必须判，否则读到的是早就出队的数据，
#@d 或者干脆是没初始化过的垃圾值。
#@d
#@d ============ 这段 Python 和 C 有什么不一样 ============
#@d
#@d   C 的函数签名是 Status DeQueue(Queue *Q, ElemType *e)，第二个参数是个
#@d   出口参数 —— C 只能返回一个值，被删的元素只好用指针写回去。
#@d   Python 可以直接返回两个值，所以这里写成 return OK, e，调用者用
#@d   r, e = Q.DeQueue() 一次就接住了。
#@d
#@d   有个小地方要当心：队空的时候 C 的 *e 压根不赋值，调用者那个 e 里留着
#@d   的还是上一次的老值；Python 这边返回的是 ERROR 和 None，一眼就能看出来
#@d   "这次什么都没取到"。
#@d
#@d   判空那句 front == rear 一模一样，出队前别忘了判。

#@s 出队，元素由 e 带回
    def DeQueue(self):
        #@s 先判空
        if self.front == self.rear:
            return ERROR, None

        #@s 取走队头元素
        e = self.data[self.front]

        #@s front 绕环前进一格
        self.front = (self.front + 1) % MAXSIZE

        #@s 成功
        return OK, e
#%end

#%module | 05 | main | main —— 把循环队列跑一遍 | 1 | 01,02,03,04 |
#%summary | 用"边进边出"跑够 100 次，看它会不会假溢出。
#@d ============ 这一节最该亲眼看到的一幕 ============
#@d
#@d 普通顺序队列只要出队几次，rear 就到头了，明明前面空着却放不进去。
#@d 循环队列跑下面这段"入队一个再出队一个"的循环 100 次，
#@d 每次都有位置 —— rear 和 front 会一起绕圈，永远不会撞墙。
#@d
#@d 打印出 front 和 rear 的变化过程，你会看到它们一次次从末尾跳回 0。
#@d
#@d ============ 这段 Python 和 C 有什么不一样 ============
#@d
#@d   C 的 int main(void) 由运行时自动调用；Python 没有这回事，惯例写成
#@d   if __name__ == '__main__': ，意思是"这个文件被直接运行时才跑，
#@d   被别人 import 时不跑"。这一行照着背就行。
#@d
#@d   C 的 PrintQueue 第二个参数是 Queue Q，值传递会把整张队列拷一份；
#@d   Python 直接传对象，函数里拿到的就是同一个队列，不拷贝。反正打印函数
#@d   只看不改，看起来一样。
#@d
#@d   出队那里差别最大：C 写 DeQueue(&Q, &e)，状态和元素分开两份；
#@d   Python 写 r, e = Q.DeQueue()，一句话就把两个值一起接住了。
#@d   如果哪次只想要元素、不关心状态，还可以把第一个接收变量写成下划线
#@d   （_, e = Q.DeQueue()），这也是 Python 里约定俗成的一个小习惯。

#@s 打印队列内容（从 front 开始，按逻辑顺序）
#@d 注意不能简单地 for (i = 0; i < MAXSIZE; i++)：
#@d 环里的元素可能"绕过弯"，必须从 front 出发绕圈走。
def PrintQueue(tag, Q):
    #@s 元素个数
    n = (Q.rear - Q.front + MAXSIZE) % MAXSIZE

    #@s 先打印标签和两个指针 —— C 的 printf 一行里塞了三个 %d，Python 用 f-string 更省事
    print(f'{tag} front={Q.front} rear={Q.rear} 共{n}个 : ', end='')
    #@s 从 front 开始绕圈走 n 步，每一步取模就绕回环里了
    for i in range(n):
        #@s end=' ' 相当于 C 的 "%d " —— 末尾那个空格
        print(f'{Q.data[(Q.front + i) % MAXSIZE]} ', end='')
    #@s 收尾换行，对应 C 的 printf("\n")
    print()

#@s 主函数
if __name__ == '__main__':
    #@s 定义队列
    Q = Queue()
    #@s 出口参数
    e = None
    #@s 循环用
    i = 0

    #@s 初始化
    Q.InitQueue()
    PrintQueue('初始化后:', Q)

    #@s 入队 10 20 30
    Q.EnQueue(10)
    Q.EnQueue(20)
    Q.EnQueue(30)
    PrintQueue('入队 10 20 30 后:', Q)

    #@s 出队一个 —— 应该是最先进入的 10
    #@d 就是这个写法：C 要传 &e 出去接，Python 两个变量一次接住
    r, e = Q.DeQueue()
    if r == OK:
        print(f'出队一个 -> {e}（最先进去的最先出来）')
    PrintQueue('出队后:', Q)

    #@s 反复入队到满，看看到底能装几个
    #@d 把 MAXSIZE 个全塞进去是不行的 —— 会留一个空位用来区分空和满。
    i = 0
    while Q.EnQueue(100 + i) == OK:
        i += 1
    print(f'最多装下 {i} 个（MAXSIZE={MAXSIZE}，故意留一格）')
    PrintQueue('装满后:', Q)

    #@s 关键一幕：边进边出跑很多次，验证不会假溢出
    #@d 普通顺序队列跑到这里早就"溢"了，循环队列能一直跑下去。
    for i in range(100):
        r, e = Q.DeQueue()
        Q.EnQueue(i)
    print('边进边出 100 次之后：')
    PrintQueue('  当前状态:', Q)
    print('  front 和 rear 都绕回小下标了 —— 这就是环的功劳')

#@s 正常结束
#@d C 的 main 在这里 return 0；Python 脚本跑到底就结束，
#@d 想中途退出才需要写 sys.exit()，这里不用。
#%end
