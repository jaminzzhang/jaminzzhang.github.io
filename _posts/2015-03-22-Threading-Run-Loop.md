---
layout: post
title: iOS并发编程（Concurrency Programming）系列之一：Run Loop
---



>引言: 并发编程是每一个开发工程师需要掌握的基本技能，而只有在深入了解了多线程相关基础之后，我们才能根据需要设计出健壮的多线程机制。本系列主要面向中级的iOS开发工程师，结合个人的开发实践，深入系统地探讨并发编程中核心思想。该系列主要分为：

>	1. [Run Loop](/posts/2015-03-22-Threading-Run-Loop)
>	2. Operation Queues VS Dispatch Queues (酝酿中)
>	3. GCD该怎么用 (酝酿中)
>	4. 锁 (酝酿中)




<br/><br/>
# 1. 线程？

并发编程，首先不是应该先谈谈线程么？个人不准备详谈线程有以下几个原因：

1. 线程是基础的知识，是每个CS相关专业的同学都可以铭记入骨的基础概念；
2. 基本原理方面，本人能力有限，还是《[操作系统](http://book.douban.com/subject/5064311/)》这些的经典书籍解释得更清楚明白；


当然，可以看看阮一峰老师的文章[进程与线程的一个简单解释](http://www.ruanyifeng.com/blog/2013/04/processes_and_threads.html)，来形象地重温下线程和进程方面的知识。


![进程和线程](/assets/images/2015-03-22/process_thread.jpg)
<br/>


<br/><br/>
# 2. Run Loop 基本概念

在实际iOS的实际开发中，简单线程任务是不建议手动创建一个线程来实现，因为手动创建并管理线程的生命周期比较麻烦，通常会使用系统提供的一些异步方法(`performSelectorInBackground: withObject:`等)、Operation Queues或者是Dispatch Queues等来实现。而只有当有持续的异步任务需求时，我们才会创建一个独立的生命周期可控的线程，而Run Loop就是控制线程生命周期并接收事件进行处理的机制。

以下是Run Loop的官方定义：

`Run loops are part of the fundamental infrastructure associated with threads. A run loop is an event processing loop that you use to schedule work and coordinate the receipt of incoming events. The purpose of a run loop is to keep your thread busy when there is work to do and put your thread to sleep when there is none.`


![Run Loop](https://developer.apple.com/library/ios/documentation/Cocoa/Conceptual/Multithreading/Art/runloop.jpg)
<br/>



假设进程是一个工厂，线程是一个流水线，那么Run Loop就是流水线上的主管；当接工厂到商家订单，分配给这个流水线时，Run Loop就启动这个流水线，让流水线动起来，生产产品；而当订单的产品生产完毕时，Run Loop就会暂时停下流水线，节约资源。有Run Loop这个主管分配生产任务，流水线才不会因为无所事事被工厂干掉；而工厂转型或者产能升级等原因，不需要这个流水线时，就会辞掉Run Loop这个主管，不再接收任何的订单，即退出线程，把所有的资源释放。



![流水线](/assets/images/2015-03-22/assembly_line.jpg)
<br/>


Run Loop并非iOS/OSX平台专属的概念，在任何平台的多线程编程中，为控制线程生命周期，接收处理异步消息，都需要类似Run Loop的循环机制来实现：从简单的一个无限顺序`do{sleep(1);//执行消息}while(true)`，到高级平台，如Android的Looper，都是类似的机制。

主线程的Run Loop在应用启动的时候就会自动创建，而其他自己创建的线程则需要在该线程下显式地调用`[NSRunLoop currentRunLoop]`，假如该线程还没有线程的话，系统会自动创建一个返回。你不能自己去创建一个Run Loop。需要注意的是Run Loop并非线程安全的，所以需要避免在其他线程上调用当前线程的Run Loop。


<br/><br/>
# 3. Run Loop支持的消息事件(Events)

Run Loop支持处理输入源（Input Source）事件和计时器（Timer）事件。其中输入源事件包括：系统的Mach Port事件、以及其他自定义输入事件。其中Mach Port是iOS/OSX系统支持的一种通讯事件；而自定义输入事件则故名思议，是需要你自己根据Run Loop的接口，实现相关的回调，来配置自定义的输入源，让Run Loop能够支持对这写输入源的监听和处理。

Cocoa中已经为开发者实现了一些常用的自定义输入源，如Perform Selector、NSConnection等；
如何配置输入源的使用场景较少，个人也没多少研究，有兴趣的通讯可以查看[官方文档](https://developer.apple.com/library/ios/documentation/Cocoa/Conceptual/Multithreading/RunLoopManagement/RunLoopManagement.html#//apple_ref/doc/uid/10000057i-CH16-SW3)

需要注意的是，在启动Run Loop之前，必须先添加监听的输入源事件或者Timer事件，否则调用`[runLoop run]`会直接返回，而不会进入循环让线程长驻。很多初学的开发者会写如下代码：



{% highlight Objective-C %}
- (void)main
{
	NSRunLoop *runLoop = [NSRunLoop currentRunLoop];
	while (!self.isCancelled && !self.isFinished) {
	    [runLoop runUntilDate:[NSDate dateWithTimeIntervalSinceNow:3]];
	};
}

{% endhighlight%}

上述代码，因为Run Loop没有添加任何输入源事件或Timer事件，会立刻返回，这样的话，线程其实是一直在无限循环空转中，虽然是让线程长驻不退出，但会一直占用着CPU的时间片，而没有实现资源的合理分配；在其他线程发送一个事件给该线程，系统会自动为Run Loop添加对应输入源或者Timer，让Run Loop正常运行。也可以手动添加输入源或者Timer来让Run Loop正常运行。添加了输入源或Timer事件的Run Loop在没有事件需要处理时，会让线程进行休眠，而不会占用着CPU的时间片。

而对于没有While循环直接使用Run Loop，而且没有添加输入源或Timer的线程，那么线程会直接完成并进入死亡状态，被系统回收。



正确的使用方法应如下：

{% highlight Objective-C %}
- (void)main
{
	NSRunLoop *runLoop = [NSRunLoop currentRunLoop];
	[runLoop addPort:[NSMachPort port] forMode:NSDefaultRunLoopMode];
	while (!self.isCancelled && !self.isFinished) {
	    @autoreleasepool {
	    	[runLoop runUntilDate:[NSDate dateWithTimeIntervalSinceNow:3]];
	    }
	}
}

{% endhighlight%}

**注意，Run Loop的每个循环必须加上@autoreleasepool，用于释放每个循环结束后不再需要的内存。**




<br/><br/>
# 4. Run Loop Modes

官方文档定义：

`
A run loop mode is a collection of input sources and timers to be monitored and a collection of run loop observers to be notified.
`

在Run Loop的概念中，Run Loop Mode是一个较难理解的概念，继续上述流水线的例子：Run Loop Mode就是这条流水线上支持生成的产品类型，比如流水线即可生成塑胶类产品，也可以生成纺织类产品，但流水线在一个时刻只能在一种模式下运行，生成某一类型的产品；那当流水线进入生产塑胶类产品的模式时，而消息事件（输入事件Input Source 和 计时器事件）则是订单；接收到标记为塑胶类产品的胶手套的订单时，就可以直接排队放入流水线中生产；而那些标记为纺织类的产品如内衣等，就只能等待，只要当流水线切到生成纺织类模式的时候，才可以生产；而有些订单如鞋子，比较急着出产品，就跟流水线的主管说，可以是胶鞋也可以是布鞋，只要是鞋子就好了，此时，不管此时流水线在那种模式下，都可以直接生产鞋子。

Cocoa定义了四种Mode：

* Default：NSDefaultRunLoopMode (Cocoa) kCFRunLoopDefaultMode (Core Foundation)，默认的模式，在Run Loop没有指定Mode的时候，默认就跑在Default Mode下；
* Connection：NSConnectionReplyMode (Cocoa)，用来监听处理网络请求NSConnection的事件；
* Modal：NSModalPanelRunLoopMode (Cocoa)，OS X的Modal面板事件。
* Event tracking：UITrackingRunLoopMode(iOS) NSEventTrackingRunLoopMode (Cocoa)，用户鼠标触碰的拖动事件；
* Common modes：NSRunLoopCommonModes (Cocoa) kCFRunLoopCommonModes (Core Foundation)。可以配置的通用模式(通过方法`CFRunLoopAddCommonMode`来配置添加其他需要支持的模式)，在Cocoa中，默认包含了Default、Modal和Event tracking的模式，而在Core Foundation中，只包含了Default模式；


Run Loop可以通过`[acceptInputForMode:beforeDate:]`和`[runMode:beforeDate:]`来指定在一时间之内运行模式。假如不指定的话，Run Loop默认会运行在Default模式下（不断重复调用`runMode:NSDefaultRunLoopMode beforeDate:...`）。


在Run Loop模式中我们经常会遇到的一个问题是，在主线程，启动了一个计时器Timer，然后将手指放在一个UITableView或者UIScrollView上拖动时，计时器到了时间也不会执行。这是因为，为了更好的用户体验，在主线程中定义了Event tracking模式的优先级是最高的。当用户在拖动一个控件时，主线程的Run Loop是运行在Event tracking Mode下，而创建的Timer是默认关联为Default Mode，因此线程不会立刻执行Default Mode下接收的事件。解决的方法是：


{% highlight Objective-C %}
    NSTimer * timer = [NSTimer scheduledTimerWithTimeInterval:1.0
                                                       target:self
                                                     selector:@selector(timerFireMethod:)
                                                     userInfo:nil
                                                      repeats:YES];
    [[NSRunLoop mainRunLoop] addTimer:timer forMode:NSRunLoopCommonModes];
    //或 [[NSRunLoop currentRunLoop] addTimer:timer forMode:UITrackingRunLoopMode];
    [timer fire];

{% endhighlight%}





<br/><br/>
# 5. Run Loop的应用实践


Run Loop主要有以下三个应用场景：


<br/>
## 5.1 可维护生命周期的线程

该场景较为常见，Run Loop的作用主要是用于维护线程的生命周期，让线程不自动退出，但可以根据需要调用`[thread cancel]`，或者执行完某任务之后，在isFinished返回YES来退出线程。如下代码：


{% highlight Objective-C %}
- (void)main
{
	NSRunLoop *runLoop = [NSRunLoop currentRunLoop];
	[runLoop addPort:[NSMachPort port] forMode:NSDefaultRunLoopMode];
	while (!self.isCancelled && !self.isFinished) {
	    @autoreleasepool {
	    	[runLoop runUntilDate:[NSDate dateWithTimeIntervalSinceNow:3]];
	    }
	}
}

{% endhighlight%}

<br/>
## 5.2 长驻线程，用于执行一些预期会一直存在的任务

如下代码，摘自AFNetworking库，创建一个长驻的线程，该线程的生命周期跟App相同，用于发送请求和接收回调。注意，该线程在启动之后，无法通过调用`[thread cancel]`俩结束线程（甚至`removePort:forMode:`也无法保证Run Loop会退出，因为系统可能会给Run Loop添加另外一些输入源）：

{% highlight Objective-C %}
- (void)main
{
	@autoreleasepool {
		NSRunLoop *runLoop = [NSRunLoop currentRunLoop];
	   	[runLoop addPort:[NSMachPort port] forMode:NSDefaultRunLoopMode];
	    [runLoop run];
	}
}
{% endhighlight %}


<br/>
## 5.3 在一定时间内监听某种事件，或执行某种任务的线程

如下代码所示，在30分钟内，每隔30s执行`onTimerFired:`。这种场景一般会出现在，如我需要在应用启动之后，在一定时间内持续更新某项数据。

{% highlight Objective-C %}
- (void)main
{
	@autoreleasepool {
	    NSRunLoop * runLoop = [NSRunLoop currentRunLoop];
	    NSTimer * udpateTimer = [NSTimer timerWithTimeInterval:30
	                                                    target:self
	                                                  selector:@selector(onTimerFired:)
	                                                  userInfo:nil
	                                                   repeats:YES];
	    [runLoop addTimer:udpateTimer forMode:NSRunLoopCommonModes];
	    [runLoop runUntilDate:[NSDate dateWithTimeIntervalSinceNow:60*30]];
	}
}
{% endhighlight %}




<br/><br/>
# 6. 总结

本文从本人的编程实践出发，主要讲解了我们在使用线程时，需要了解的Run Loop相关知识点，以及常用的场景。由于篇幅和个人的知识有限，本文并没有办法覆盖到Run Loop的方方面面，有兴趣的同学可以继续深入研究。






<br />
<br />


参考：

1. [Threading Programming Guide](https://developer.apple.com/library/ios/documentation/Cocoa/Conceptual/Multithreading/Introduction/Introduction.html#//apple_ref/doc/uid/10000057i-CH1-SW1)
2. [Concurrency Programming Guide](https://developer.apple.com/library/ios/documentation/General/Conceptual/ConcurrencyProgrammingGuide/Introduction/Introduction.html)
3. [阮一峰——进程与线程的一个简单解释](http://www.ruanyifeng.com/blog/2013/04/processes_and_threads.html)
4. [Objc.io #2 Concurrent Programming](http://www.objc.io/issue-2/)



<br/><br/>

---

版权所有，转载请保留[Jaminzzhang](http://oncenote.com/)署名


