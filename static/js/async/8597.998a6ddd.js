"use strict";(self.webpackChunkdelixia=self.webpackChunkdelixia||[]).push([["8597"],{42545:function(e,t,s){s.r(t),s.d(t,{FlowGraphSetDelayBlock:()=>d});var a,i,r=s(22628),n=s(5114),o=s(709);(a=i||(i={}))[a.INIT=0]="INIT",a[a.STARTED=1]="STARTED",a[a.ENDED=2]="ENDED";class l{constructor(e){this.onEachCountObservable=new o.y$,this.onTimerAbortedObservable=new o.y$,this.onTimerEndedObservable=new o.y$,this.onStateChangedObservable=new o.y$,this._observer=null,this._breakOnNextTick=!1,this._tick=e=>{let t=Date.now();this._timer=t-this._startTime;let s={startTime:this._startTime,currentTime:t,deltaTime:this._timer,completeRate:this._timer/this._timeToEnd,payload:e},a=this._breakOnNextTick||this._breakCondition(s);a||this._timer>=this._timeToEnd?this._stop(s,a):this.onEachCountObservable.notifyObservers(s)},this._setState(0),this._contextObservable=e.contextObservable,this._observableParameters=e.observableParameters??{},this._breakCondition=e.breakCondition??(()=>!1),this._timeToEnd=e.timeout,e.onEnded&&this.onTimerEndedObservable.add(e.onEnded),e.onTick&&this.onEachCountObservable.add(e.onTick),e.onAborted&&this.onTimerAbortedObservable.add(e.onAborted)}set breakCondition(e){this._breakCondition=e}clearObservables(){this.onEachCountObservable.clear(),this.onTimerAbortedObservable.clear(),this.onTimerEndedObservable.clear(),this.onStateChangedObservable.clear()}start(e=this._timeToEnd){if(1===this._state)throw Error("Timer already started. Please stop it before starting again");this._timeToEnd=e,this._startTime=Date.now(),this._timer=0,this._observer=this._contextObservable.add(this._tick,this._observableParameters.mask,this._observableParameters.insertFirst,this._observableParameters.scope),this._setState(1)}stop(){1===this._state&&(this._breakOnNextTick=!0)}dispose(){this._observer&&this._contextObservable.remove(this._observer),this.clearObservables()}_setState(e){this._state=e,this.onStateChangedObservable.notifyObservers(this._state)}_stop(e,t=!1){this._contextObservable.remove(this._observer),this._setState(2),t?this.onTimerAbortedObservable.notifyObservers(e):this.onTimerEndedObservable.notifyObservers(e)}}var b=s(11597),h=s(16118);class d extends r.g{constructor(e){super(e),this.cancel=this._registerSignalInput("cancel"),this.duration=this.registerDataInput("duration",n.ab),this.lastDelayIndex=this.registerDataOutput("lastDelayIndex",n.ab,-1)}_preparePendingTasks(e){let t=this.duration.getValue(e);if(t<0||isNaN(t)||!isFinite(t))return this._reportError(e,"Invalid duration in SetDelay block");if(e._getGlobalContextVariable("activeDelays",0)>=d.MaxParallelDelayCount)return this._reportError(e,"Max parallel delays reached");let s=e._getGlobalContextVariable("lastDelayIndex",-1),a=e._getExecutionVariable(this,"pendingDelays",[]),i=new l({timeout:1e3*t,contextObservable:e.configuration.scene.onBeforeRenderObservable,onEnded:()=>this._onEnded(i,e)});i.start();let r=s+1;this.lastDelayIndex.setValue(r,e),e._setGlobalContextVariable("lastDelayIndex",r),a[r]=i,e._setExecutionVariable(this,"pendingDelays",a)}_cancelPendingTasks(e){for(let t of e._getExecutionVariable(this,"pendingDelays",[]))t?.dispose();e._deleteExecutionVariable(this,"pendingDelays"),this.lastDelayIndex.setValue(-1,e)}_execute(e,t){if(t===this.cancel){this._cancelPendingTasks(e);return}this._preparePendingTasks(e),this.out._activateSignal(e)}getClassName(){return"FlowGraphSetDelayBlock"}_onEnded(e,t){let s=t._getExecutionVariable(this,"pendingDelays",[]),a=s.indexOf(e);-1!==a?s.splice(a,1):b.Y.Warn("FlowGraphTimerBlock: Timer ended but was not found in the running timers list"),t._removePendingBlock(this),this.done._activateSignal(t)}}d.MaxParallelDelayCount=100,(0,h.H7)("FlowGraphSetDelayBlock",d)}}]);