#%module | 01 | typedef | 头文件与 typedef | 1 |
#%summary | 一个定长数组 + 一个 top 下标，top = -1 表示空栈。
#@d ============ 顺序栈长什么样 ============
#@d
#@d   入栈 40 之后：
#@d
#@d   下标   0    1    2    3    4    5
#@d        ┌────┬────┬────┬────┬────┬────┐
#@d   data │ 10 │ 20 │ 30 │ 40 │    │    │
#@d        └────┴────┴────┴────┴────┴────┘
#@d                            ↑
#@d                          top = 3
#@d
#@d 关键约定：**top 指向栈顶元素本身**，而栈顶就是"最后进来的那个"。
#@d
#@d   空栈      top = -1
#@d   一个元素  top = 0
#@d   装满      top = MAXSIZE - 1
#@d
#@d ============ 为什么这样约定 ============
#@d
#@d 也有人让 top 指向"栈顶上面那个空位"，那样空栈是 top = 0。
#@d 两种写法都对，但**混用必出 bug**。本文件统一用"top 指栈顶元素"：
#@d
#@d   入栈：先 top++ ，再把元素放进 data[top]
#@d   出栈：先取走 data[top] ，再 top--
#@d
#@d 一句话记住：**top 永远指着有东西的那个格子**，它指向 -1 就是空。
#@d
#@d ============ 这段 Python 和 C 不一样的地方 ============
#@d
#@d   C 得先 typedef int ElemType、typedef int Status，告诉编译器元素和返回值
#@d   是什么类型；Python 不用声明类型，列表里想放什么就放什么，
#@d   所以这两行（连它们上面的 //@s 元素类型、//@s 返回值类型）直接省掉了。
#@d
#@d   C 的 struct 只装数据，入栈出栈要另写函数，还得写 Stack *S、S->top 这种指针写法。
#@d   Python 用 class 把数据和方法装在一起，方法自带 self：
#@d   self.data 就是 C 的 S->data，self.top 就是 S->top，那个 -> 不用写了。

#@s 栈最多能装多少个
MAXSIZE = 100

#@s 状态码
#@d C 里是 #define 宏，Python 直接写两个普通变量，用起来一样
OK = 1
ERROR = 0

#@s 顺序栈 = 定长数组 + 栈顶下标
class Stack:
#@s 连续内存，和顺序表一样
    def __init__(self):
        self.data = [None] * MAXSIZE
#@s 栈顶元素的下标；-1 表示空栈
        self.top = -1
#%end

#%module | 02 | InitStack | InitStack —— 初始化 | 1 | 01 |
#%summary | 把 top 置成 -1，这就是"空栈"。
#@d ============ 空栈的表示 ============
#@d
#@d 和顺序表一样，初始化什么都不用清，只改一个标记位。
#@d 只是这里的标记是 top = -1，而不是 length = 0。
#@d
#@d 注意 -1 这个值本身很讲究：它是**合法下标 0 的前一个**，
#@d 所以"top == -1"和"top == 0（有一个元素）"能区分得清清楚楚。
#@d 如果图省事用 0 表示空栈，就分不清"空"和"有一个元素"了。
#@d
#@d ============ 这段 Python 和 C 不一样的地方 ============
#@d
#@d   C 里要写成 InitStack(Stack *S)，函数里改 S->top；那个指针是必须的，
#@d   因为传值的话改的是副本，调用者手里那张栈一点变化都没有。
#@d   Python 里 self 就是调用者那张栈本身，self.top = -1 改的就是它，
#@d   所以既不用写 &S，也不存在"忘了取地址"这种高频错误。

    #@s 空栈：top 指向"不存在的位置"
    def InitStack(self):
        self.top = -1
        #@s 成功
        return OK
#%end

#%module | 03 | Push | Push —— 入栈 | 2 | 01,02 |
#%summary | 先判满，再 top++ ，最后放元素 —— 三步少一步都不行。
#@d ============ 入栈的三步 ============
#@d
#@d   入栈前： 10  20  30  _   _     top = 2
#@d             0   1   2   3   4
#@d
#@d   ① top++   →  top 从 2 变成 3（指向那个空位）
#@d   ② 存数据  →  data[3] = 40
#@d
#@d   入栈后： 10  20  30  40  _     top = 3
#@d
#@d 顺序不能反：如果先把 data[top] 写成 40，就把原来的 30 覆盖掉了。
#@d （这一点和顺序表插入"要从后往前搬"是同一个道理：别踩还没读的数据。）
#@d
#@d ============ 判满是必须的 ============
#@d
#@d 什么时候满？top 已经顶到最后一个格子 MAXSIZE-1 的时候。
#@d
#@d   装满： 10  20  30  40  50     top = 4 = MAXSIZE-1
#@d           0   1   2   3   4
#@d
#@d 这时再来一个，top++ 会让 top 变成 5，data[5] 就越界了。
#@d C 语言不会帮你检查数组越界 —— 它会闷头写进去，踩坏旁边的内存，
#@d 然后你在别的地方看到莫名其妙的错。所以**判满必须自己写**。
#@d
#@d ============ 这段 Python 和 C 不一样的地方 ============
#@d
#@d   C 的数组是定死的，越界了它也不吭声，所以那句判满的 if 是保命用的；
#@d   Python 的列表越界会直接抛 IndexError，而且想多长还能自己变长。
#@d   但判满照样得写 —— 顺序栈的容量本来就是固定的，教材怎么写就怎么写。
#@d
#@d   两个小语法差别：C 的 S->top++ 在 Python 里要写成 self.top += 1
#@d   （Python 没有 ++ 运算符），C 的 if (…) { } 在 Python 里靠缩进和冒号
#@d   划范围，少写那个冒号就会报 SyntaxError。

    #@s 压入一个元素 e
    def Push(self, e):
        #@s 第一步永远是判满 —— 顺序栈的容量是固定的
        #@d 注意比较的是 MAXSIZE-1（最后一个合法下标），不是 MAXSIZE。
        #@d 写成 top >= MAXSIZE 就晚了：那时候已经越界了。
        if self.top >= MAXSIZE - 1:
            #@s 满了就拒绝，而不是硬塞
            return ERROR

        #@s 先让 top 指向那个空位
        self.top += 1

        #@s 再放进去 —— 此时 top 正好指着新元素
        self.data[self.top] = e

        #@s 成功
        return OK
#%end

#%module | 04 | Pop | Pop —— 出栈 | 2 | 01,02 |
#%summary | 先判空，取走 data[top]，然后 top-- 。
#@d ============ 出栈是入栈的镜像 ============
#@d
#@d   出栈前： 10  20  30  40  _     top = 3
#@d
#@d   ① 取数据  →  e = data[3] = 40
#@d   ② top--   →  top 从 3 变成 2
#@d
#@d   出栈后： 10  20  30  40  _     top = 2
#@d                              ↑
#@d                        40 还在数组里，但已经"不属于这张栈"了
#@d
#@d 这一点很重要：**出栈并不擦除数据**，只是把 top 往回挪一格。
#@d 这和顺序表删除一样 —— 数据还在，但 length/top 说不算就不算。
#@d
#@d 下次入栈会直接把这格覆盖掉。所以出栈后**别再去读 data[top+1]**，
#@d 那个值随时可能被冲掉。
#@d
#@d ============ 判空也是必须的 ============
#@d 空栈时 top = -1。这时候如果去读 data[-1]，那是数组前面的内存,
#@d 读到的是别的变量的值 —— 不会崩，但结果完全是荒唐的。
#@d
#@d ============ 这段 Python 和 C 不一样的地方 ============
#@d
#@d   C 一次只能返回一个值，所以栈顶元素只能靠 ElemType *e 这个"出口参数"
#@d   写回给调用者，调用的时候要写 Pop(&S, &e)，两个 & 都少不了。
#@d   Python 直接 return OK, e 就行，调用者写 r, e = S.Pop() 一次接住两个，
#@d   不用先声明变量再传地址，少绕一圈。
#@d
#@d   还有个小坑：Python 里 data[-1] 是"最后一个元素"，根本不算越界。
#@d   好在出栈前已经判过空了，只要判空写对，就永远走不到那一步。

    #@s e 是"带回栈顶元素"的出口参数 —— Python 里它变成第二个返回值
    def Pop(self):
        #@s 第一步永远是判空
        #@d 注意是 top == -1 而不是 top == 0：top = 0 时栈里有**一个**元素，
        #@d 那是可以正常出栈的。
        if self.top < 0:
            #@s 空栈不能再出
            return ERROR, None

        #@s 先把栈顶元素取出来
        e = self.data[self.top]

        #@s 再把 top 往回挪一格 —— 这一格从此不算数了
        self.top -= 1

        #@s 成功
        return OK, e
#%end

#%module | 05 | main | main —— 把堆栈跑一遍 | 1 | 01,02,03,04 |
#%summary | 入栈、出栈、以及两次越界，看看后进先出到底是什么样。
#@d ============ 用输出验证"后进先出" ============
#@d
#@d 依次压入 10、20、30，再连续弹出，出来的顺序是 30、20、10 ——
#@d 和进去的顺序**正好相反**。这就是 LIFO（Last In First Out）。
#@d
#@d 别小看这一条：后面表达式求值、括号匹配、递归、DFS 全靠它。
#@d
#@d ============ 这段 Python 和 C 不一样的地方 ============
#@d
#@d   C 的 int main(void) 是运行时自动调用的；Python 没有"入口函数"这回事，
#@d   固定写 if __name__ == '__main__':，意思是"直接运行这个文件才执行，
#@d   被别的文件 import 时不执行"。
#@d
#@d   C 的 printf 不换行，Python 的 print 打完了自己换行，
#@d   所以想连成一串打印就得加 end=' '，不然一个数字占一行。
#@d
#@d   C 的 while (Pop(&S, &e) == OK) 这种"把函数调用塞进条件里"的写法，
#@d   Python 写不了，改成 while True 里面先 r, e = S.Pop()，再 if r != OK: break，
#@d   效果一样，只是多了两行。
#@d
#@d   C 的 main 开头要先声明 Stack S; ElemType e; int i;，Python 不用声明变量，
#@d   随用随写 —— e 是被 r, e = S.Pop() 直接接住的，i 是 for 自己产生的。

#@s 打印当前栈里的内容（从栈底到栈顶）
def PrintStack(tag, S):
#@s 先打印标签和 top 的下标
    print(f'{tag} top={S.top} : ', end='')
#@s 从栈底到栈顶，一个一个打印出来
#@d 对应 C 的 for (i = 0; i <= S.top; i++)，写成 Python 就是 range(S.top + 1)：
#@d 因为 range 不包含右端点，所以要 +1 才能把栈顶那个元素也带上。
    for i in range(S.top + 1):
        print(f'{S.data[i]} ', end='')
#@s 这里补一个换行 —— 前面都被 end=' ' 顶住了
    print()

#@s 主函数
if __name__ == '__main__':
#@s 定义一张栈
    S = Stack()

#@s 先初始化
    S.InitStack()
    PrintStack('初始化后:', S)

#@s 依次压入 10、20、30
    S.Push(10)
    S.Push(20)
    S.Push(30)
    PrintStack('压入 10 20 30 后:', S)

#@s 弹一个出来 —— 应该是最后进去的 30
    r, e = S.Pop()
    if r == OK:
        print(f'弹出一个 -> {e}（最后进去的最先出来）')
    PrintStack('弹出后:', S)

#@s 把剩下的都弹光，看顺序
    print('继续弹出: ', end='')
    while True:
        r, e = S.Pop()
        if r != OK:
            break
        print(f'{e} ', end='')
    print()
    PrintStack('弹空后:', S)

#@s 空栈再弹应该被挡住
    r, e = S.Pop()
    if r == ERROR:
        print('空栈弹出 -> 被拒绝（top == -1）')

#@s 压满再压一个，也应该被挡住
#@d 这一次循环压 MAXSIZE 个，正好压满（top 到 MAXSIZE-1）
#@d C 里这段还套了一对大括号 { }，那是为了让 int i 的作用范围小一点；
#@d Python 没有这种块作用域，也不用大括号，直接写 for 就行。
    for i in range(MAXSIZE):
        S.Push(i)
    print(f'压满后 top = {S.top}（MAXSIZE-1 = {MAXSIZE - 1}）')
    if S.Push(999) == ERROR:
        print('满栈再压 -> 被拒绝（已到 MAXSIZE-1）')

#@s 正常结束
#%end
