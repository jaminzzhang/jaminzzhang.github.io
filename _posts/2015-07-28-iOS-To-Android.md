---
layout: post
title: iOS到Android到底有多远
---

<br/>

在iOS开发混了4年之后，又重拾荒废了4年的Android，感慨时间过得太快，有时间我会回顾下2010当年的iOS/Android平台的萌芽期历史；

从重拾摸索，再到上线两个App，四五个月时间。这段时间的学习和研究，颇多冲击和体会，所以就有了这篇文章。本文主要从iOS转Android开发角度，对比两个平台应用开发的异同。希望对想学习Android开发的iOS开发者，或者想兼Android、iOS开发的同学，有所帮助。另，Objc也做过一期Android的专题，讲的还可以：[objc#Android#](http://www.objc.io/issues/11-android/)

<br/>
<br/>

===
<br/>

#1 语言

从iOS到Android开发，首先遇到的难题就是编程语言的改变，由于在大学时，跟着实验室老师做项目就是用Java写J2EE，所以Java的基础知识还记得，简单看看代码基本就上手了。

编程语言的争论对比由来已久，本文并不想引发月经般的口水战，没有全能的语言，只能说在不同语言有不同的适应场景。作为比Java早生整整13年的Objective-C（Objective-C: 1982, Java: 1995，来源于Wiki），整体上来说，在语言特性方面落后于Java太多，那么多年才发展到版本2，而Java已然来到了版本9。从iOS到Android，对比Objective-C和Java，更深刻理解Objective-C语言的局限性：

<br/>
##1.1 泛型

泛型是现代编程语言非常重要而有用的特性，能够提高代码复用率，并约束参数类型提高安全性。泛型是一个非常强大特性，以至于有泛型编程这以课题。可惜Obective-C直到前不久的iOS9发布，才更新只对Collection类型支持泛型，然而却没什么用；

<br/>
##1.2 枚举

Objective-C是C的超集，完全兼容C语言，所以其枚举还一直沿用着C语言的枚举，但现有的面向对象的高级语言，已经将枚举从一个基本数据类型升级为类，这大大增强了枚举的扩展性。如OC的枚举只能是整型类型，如果需要获得枚举对应的数据（如枚举的名称），只能自己添加映射的代码；但Java的枚举，可以扩展出字段name，来对应枚举的名称；

<br/>
##1.3 抽象abstract

抽象类和抽象方法是OOP中重要的概念，而OC一直没有支持该特性，这对于面向对象的抽象封装是非常大的限制。

<br/>
##1.4 方法访问控制

OC无法使用public/private/protected/final等关键字来控制方法的访问权限。这其实是由OC是动态语言所决定的。从根本上来说，OC是不存在private方法的，因为所有的方法都可以用performSelector来进行访问，当然Java也可以通过反射实现类似的功能，所以从安全性上来说是基本一致的，不同的只是模块封装。


当然，跟Java相比，OC也有非常多的优势，如比GC更高效的内存管理，更简单易用的多线程，更为明确的语义风格等。但从长远来看，OC已落后Java一个身位，跟不上当前iOS/OSX系统的发展，而由于设计理念和历史包袱存在，重新发明一种新的编程语言势在必行，才有了Swift的横空出世、应运而生。Swift确实是新一代的编程语言，吸收了多种面向对象高级编程语言以及脚本语言的优点。随着Swift 2.0的发布并开源，该语言日趋稳定，建议iOS开发同学可以开始深入学习了，Swift替换Objective-C，很可能比你想象的要快。

反观Android这边，Java方兴未艾，而Go作为Google的明星编程语言，去年开始支持Android NDK的开发，而并没有取代Java的计划；以Java现有的基数以及在服务端的占有率，Go想在要在Android平台上取代Java，可能需要等到Go在Server端超过Java才有可能。


<br/><br/>
#2 系统平台

不管是Windows、iOS、Android还是Blackberry，做应用开发都只能依托于这些系统平台，能做的不能做的，都由平台决定。这既是开发者的福利，也是开发者的悲哀。福利是因为有个完善的平台，开发者能够很容易就能够实现一些复杂的功能，如GPS、陀螺仪、图片处理等；说是悲哀，是开发者已经限定在这个平台的圈子内，就像人的生死，平台已有生死，当一个平台灭亡时，往往有一大批的开发者要么一起死亡，要么面临转型。所以，优秀的开发者都不应该禁锢在某个平台上，多去思考和学习与平台不相关的技术思想。iOS/Android有一天也会像Smbian一样死去，但多线程、算法、内存管理、网络、设计模式这些思想不会死去；也许OpenGL/OpenCV等也会死去，但图形算法不会；就像今天Objective-C正慢慢被Swift取代，但Cocoa库还是在传承。

从iOS到Android，除了语言这一最直观的差异之外，还有系统平台上的差异。开发iOS应用
，和开发Android应用之间，有哪些平台设计上的异同呢？


<br/>
##2.1 [Context](https://developer.android.com/reference/android/content/Context.html)

在开发Android应用过程中，你会发现，不管是第三方库还是系统的API，基本都会有Context做为初始化的参数，或者是传递参数：如`public TextView(Context context)`、 ` SQLiteOpenHelper(Context context, String name, CursorFactory factory, int version)` 等；

Context，故名思议，就是程序的上下文，在Android开发中，主要有Application、Activity、Service、BroadcastReceiver、ContentProvider这几种Context，类图如下：

![Context](/assets/images/2015-07-28/context.png)

引自[http://blog.csdn.net/qinjuning/article/details/73106](http://blog.csdn.net/qinjuning/article/details/7310620)
 
<br/>
具体的相关实现这里不赘述，很多的API，之所以引用context，主要是为了取得整个App的上下文。任何继承Context抽象类的类实例都可以通过getApplicationContext()来获取应用程序的上下文，用于访问应用相关资源。查看`android.content.Context.java`的源代码，其接口所实现的功能主要是访问如安装包、资源包、图片、字符串、通知等应用相关资源。因此，假如你需要访问这些资源，要么继承ContextWrapper，要么使用context来进行初始化（参数传递）。

在这一方面，iOS采用了去中心化的方式。iOS将访问资源都进行了模块划分及封装，如使用使用[NSBundle mainBundle]访问应用程序包资源；可以使用`NSSearchPathForDirectoriesInDomains()`来查找路径；如取应用内图片，Android需要由context取：`context.getResources().getDrawable(id)`，而iOS则是[UIImage imageNamed:@“image_name"]等。两种方式对比，个人觉得各有优劣：iOS访问更为方便，设计上有更大的自由度；而Android则让访问比较可控。


<br/>
##2.2 [Activity](http://developer.android.com/guide/components/activities.html)

Activity就相当于iOS的ViewController，用法也基本上大同小异，上一节（Context）也介绍了Activity是继承自Context。与iOS的ViewController的差异，主要有以下几点：

1）与iOS的UIViewController需要App内部使用UINavigationController来管理不同，Android自己管理了Activity栈，用户操作进入某个新的界面，一般会push一个新的Activity到栈顶，而用户按Android的返回键，最顶的Activity会被Pop。具体的栈管理机制，可以查看文档《[Tasks and Back Stack](http://developer.android.com/guide/components/tasks-and-back-stack.html)》

2）UIViewController可以嵌套多个UIViewController，但Activity一般不能嵌套多个Activity。说一般，是因为之前Android有个`ActivityGroup`的组件，可以实现嵌套。但该组件在API level 13 已被废弃。现在一般使用 Fragment 实现不同界面组合嵌套。

<br/>
##2.3 [Intent](http://developer.android.com/intl/zh-cn/guide/components/intents-filters.html)

Intent，官方文档的描述： an abstract description of an operation to be performed。是用来向其他App组件请求操作的消息对象。简单的来说，Intent就是封装数据和Action的消息体。主要用于：

1）启动一个Activity: `startActivity(Intent intent, Bundle options);`

2）发送广播: `sendBroadcast(Intent intent)`

3）启动服务: `startService(Intent intent)`

在iOS方面，并没有与Intent相对应的组件，iOS并没有封装消息体，一般都是使用Dictionary来传递信息，而切换到新的ViewController，一般都是直接通过接口约定好的对象参数来传递。

另外，Intent一般使用Extras来传递Action所需要的附加信息数据，而Extras中的数据类型只能是基础数据类型、字符串和序列化(Serializable/Parcelable)数据，而不支持其他对象数据直接传递，主要原因是Intent不只是为用于进程内的传递，也支持跨进程传递，所以无法直接传递对象。如果需要传递对象数据，就需要让对象的类实现(Serializable/Parcelable)序列化接口，由于Serializable序列化性能较低，推荐使用Parcelable。但由于Java是自动支持Serializable，所以实现Serializable非常方便，只需要在类中声明实现Serializable接口就可以了；而Parcelable就要复杂多了。希望Android能够改进这一点。

<br/>
##2.4 其他 

当然，两个平台设计上有较大差异的地方绝对不止上述几处，本文只简叙了常用的几种场景，更多差异对比，等待你深入挖掘体会。


<br/><br/>
#3 架构

所幸的是，我在开发出了iOS版应用之后开发Android版的，所以架构基本上可以直接沿用，只需要针对相应的语言特性做一些调整。现有的移动应用，基本都是从典型的MVC架构上来衍生或者演变，无论在iOS流行的MVVM还是Andorid上流行的MVP，本质上没有太大的差别，而(MV)VM与(MV)P相比，更倾向于数据绑定而已。

架构，其实就是对软件整体结构和组件的抽象，最终的目的，都是通过解耦来实现软件的健壮性、扩展性和可维护性等。虽架构设计是脱离语言的结构抽象，但实现架构设计还是要依赖于平台，最终落实到语言实现；

<br/>
##3.1 架构范式（architectural pattern）：

前面已经说了，无论iOS还是Android，MVC都是这两个平台应用的基本架构设计范式，以下两张图可以说明一切：

iOS的MVC：

![iOS MVC](/assets/images/2015-07-28/ios-mvc.png)

<br/>
Android的MVC

![Android](/assets/images/2015-07-28/android-mvc.jpg)
<br/>

上图略有不同（在于Model与View的交互，标准的MVC中，两者是有交互的，但实现中，两者的交互比较少），但基本逻辑是一致的，都可以一一代入。所以，无论是iOS开发工程师转Android，或者是Android开发工程师转iOS，只要过了语言关，看几个示例，基本就理解了一个App的大体架构。


<br/>
##3.2 接口

两个平台基本没有太大的差别，由于Android支持泛型和抽象类，所以Android的接口设计会比较灵活。这种灵活性，只有深入使用体验才会有深的体会，这里不深入讲解。但架构设计中，往往会忽略的就是接口的规范性和一致性。将接口进行统一的规范，会让整个架构实现变得非常一致，团队的每一个人只要了解了一个模块的架构设计，就基本了解了全局架构计。这主要体现在：

* 命名一致：如，获取数据的方法，是使用 `getXxxx(callBack)`，还是用 `fetchXxxx(callBack)`/`loadXxxx(callBack)` 等等，诸如此类的一般性操作；统一命名，甚至于继承同样的父接口，能够让层与层间交互统一，形成统一的代码规范。
* 回调一致：制定统一的回调机制，在回调机制中可以加入线程切换的逻辑。如我们界面经常需要向业务逻辑层发起操作或者获取数据，一般会在业务逻辑层使用异步线程来处理，完成之后在主线程回调，让应用在主线程上去更新界面。


<br/>
##3.3 回调

回调其实也属于接口设计，由于平台上的差异，iOS的回调多使用委托(delegate)和Block，如：

{% highlight Objective-C %}

//delegate
- (void)callBack
{
    if ([self.delegate respondsToSelector:@selector(doSomething)]) {
        [self.delegate doSomething];
    }
}



//block
- (void)callBackWithCompletion:(void (^)(bool isSuccessed))completion
{
    if (nil != completion) {
        completion(YES);
    }
}
{% endhighlight %}

而Java由于不支持Block，但支持匿名类（Anonymous class），所以Java的大部分回调也是委托和匿名类（都是代理）。如：


{% highlight java %}
//Anonymous class
public abstract class WQBasicListener<T> {
/*
 * Callback
 */
public abstract void onFinish(T resultObj);

/*
 * Callback
 *
 * @param error        cause of task failure
 */
public abstract void onFailure(WQError error);

/*
 * Callback
 */
public abstract void onCancel();
}

public void callBack(WQBasicListener<String> listener) {
    String str = ...
    if (null != listener) {
        listener.onFinish(str);
    }
}

{% endhighlight %}


Block与匿名类，两者非常相似，同属于闭包（closures）的概念，都是传递代码块给被调用者进行回调；区别是：Block更为简单易用，而匿名类则作为类对象来传递，可以进行泛化和封装等，更为强大。

<br/>
##3.4 多线程

我们为什么要用多线程？这是非常简单的问题，但非常多的开发同学其实都无法正确回答。对于一个应用进程来讲，资源其实是限定的，那把任务放在一个线程中串行执行，与切分成几个任务再一个一个去执行有什么区别呢？其实，对于限定的资源来说，多线程：一、合理规划调度任务；简单的来说，就是可以让主要的任务先执行，不重要的任务等到比较空闲的时候再执行。就如应用先保证主线程渲染，其他加载数据的等任务等稍后异步再处理；二、支持并行；现在的CPU早已经进入了多核时代，多核就意味着任务可正真并行，而不是单一的流水线切分时间片。

现在的移动开发领域，基本上不存在单线程的应用，在进行架构设计时，笔者认为多线程设计也是多线程设计中只要的一环，也是区分初级程序员和合格程序员最重要的因素之一。逻辑业务越复杂，就越需要抽象，越需要简单的多线程设计方案。而由于平台的不同，iOS与Android的多线程实现方式也是有很大的不同，但基本的概念和设计理念是一样的：

* 永远不要阻塞主线程：iOS和Android都一样，界面渲染都有个帧率，就是隔多少毫秒刷新一次界面，这样就能够保证App在用户眼睛里不会存在卡顿和拖影等。永远不要阻塞主线程，把一切耗时的操作都搬到异步线程中去。写完代码，iOS可以用Instruments的Time Profiler + Core Animation跑一下，看看帧率是否正常，主线程的任务占比；对应Android就是DDMS。

* 按模块设计线程：子模块有自己独立的线程，可以保证模块中数据的线程安全，还能够让模块中的任务按照循序执行，避免了死锁的产生。当然，当涉及到模块间的交互时，能够使用异步就不要使用同步；如涉及到多线程访问的时候，最好使用细粒度的锁；这些措施都能够保证死锁的发生。

* 根据任务复杂度划分线程：在进行模块设计的时候，不可能每个模块的业务逻辑复杂度都是一样的，总有一些模块会比较复杂，或者经常被调用，此时，就需要考虑负载均衡；当该模块任务是CPU密集型任务，则有两种方案：一、在划分细粒度的任务，放到不同的线程中执行；二、使用多线程来支持任务并行。但需要注意的是，这两种方法都需要关注避免死锁，以及数据的线程安全。

* 合理的线程池机制：线程池就是为了线程的复用，减少创建线程的消耗的同时，让线程调度更为合理。这方面两个平台都提供了不错的Api支持，iOS这边有Operation Queue和GCD，而Android则有Executor。iOS由于有GCD的存在，让线程池的调用变得非常简单，所以iOS基本上很少直接创建使用某个线程，而是直接使用GCD；而Executor与Operation Queue的用法基本一致，在Android上，自己创建线程并管理线程周期的逻辑会比较常见。


<br/><br/>
#4 IDE

IDE，作为开发者必备的工具，其易用性和稳定性实实在在的影响着开发者的效率和心情。截止到2015年6月30日，两家自家的IDE发展都可圈可点。

* iOS，Xcode基本是唯一的选择。说基本是因为还有[AppCode](https://www.jetbrains.com/objc/)。我是之前看一位大牛同事用才知道的。AppCode，JB出品，确实是非常Cool而高效的工具，如果是之前就使用JetBrains家IDE的同学，基本是上手即用，而且有一堆通用的插件直接使用，这对于使用Android Studio/IntelliJ IDEA开发Android的同学来说也是极大的福音，至少在IDE这一块不需要太长的时间摸索熟悉。但对于初中级开发者，个人还是会推荐Xcode，原因基本上就等同于现在会推荐你使用Android Studio，而不是IntelliJ IDEA，更不是Eclipse一样。毕竟是苹果自家的工具，不仅集成有非常多的关键功能特性，如新语言特性支持、Debug辅助等，最主要的是有大量的用户和WWDC等资源来学习和解决问题，更容易iOS开发中的关键功能和特性；当然，Xcode如语法提示弱，版本控制支持渣，经常性无缘无故Crash等诸多问题还是让人深恶痛绝的。建议有一定经验的开发者，AppCode与Xcode结合使用。至于Visual Studio？等它发布了再说。


* Android家的IDE主要就是Eclipse和Android Studio，由于Eclipse从一开始就是Android官方指定的IDE，知道三天前(2015年6月27日)，Google宣布终止对Eclipse的支持。个人一直知道Android Studio必然会代替Eclipse，这一天来得并不算早。笔者在大学的时候，用过MyEclipse折腾J2EE；到2010年的时，短暂使用Eclipse开发Android两个月，后续断断续续使用了下，对Eclipse一直感觉一般；所以在2014年末重新拾起Android的时候，就抛弃Eclipse，直接使用Android Studio v0.8，现在Android Studio的稳定版本已到1.2，发展迅速。Android Studio是Google和JetBrains合作，以IntelliJ IDEA为基础开发的IDE，即整合了IntelliJ IDEA强大的功能，又有Google自家的支持，前景一片大好。2V1，对比Eclipse的优势，笔者不多说，各位可自己Google下。现在还在使用Eclipse的同学，该转到Android Studio了。


以Xcode与Android Studio两者对比，由于Android Studio直接是从IntelliJ IDEA发展而来，在代码编辑方面会有压倒性的优势；而且整合了非常强大的Gradle构建工具，有着强大而易用的依赖管理和多工程构建；而这方面，Xcode就只能掩面了；不仅项目工程依赖管理复杂，而且一直没有支持整合CocoaPoads来作第三方库依赖。但Xcode在深入整合的Debug工具，以及强大的Instruments分析工具，较Java的DDMS要更为强大易用。从发展来看，个人对这两个IDE都非常有信心，



<br/><br/>
#5总结

iOS到Android，到底有多远？其实就是要看你在原本的路上走了多远。作为某个平台上的应用开发者，除了深入理解平台之外，我们尽量多关注平台无关的基础知识，这些才能决定你能走多远。


技术的深度与广度，一直是程序员矛盾点，不知道该如何取舍。其实走深度，到了某个瓶颈，你会发现需要其他知识来支持；而深入到了一定阶段，又会发现拓展到了其他知识体系上。比如深入研究iOS系统，必然会研究到XUN，BSD，然后拓展到UNIX；而研究Android内核，又会拓展到了Linux；在这做JS都有Reat Native这样怪物的今天，你还觉得。所以，建议初级开发者，一开始选择一个自己喜欢的平台，沉下心来研究，慢慢堆砌自己的城墙，希冀着成为长城的那一天。


<br/>
ps：研究Android时间并不长，有错漏的地方还望同学不吝指正。


<br/><br/>

---

版权所有，转载请保留[Jaminzzhang](http://oncenote.com/)署名