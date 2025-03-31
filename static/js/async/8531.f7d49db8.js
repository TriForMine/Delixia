"use strict";(self.webpackChunkdelixia=self.webpackChunkdelixia||[]).push([["8531"],{18708:function(t,e,i){i.r(e),i.d(e,{FlowGraphPlayAnimationBlock:()=>s});var n=i(22628),a=i(5114),r=i(16118),o=i(4252);class s extends n.g{constructor(t){super(t,["animationLoop","animationEnd","animationGroupLoop"]),this.config=t,this.speed=this.registerDataInput("speed",a.ab),this.loop=this.registerDataInput("loop",a.PE),this.from=this.registerDataInput("from",a.ab,0),this.to=this.registerDataInput("to",a.ab),this.currentFrame=this.registerDataOutput("currentFrame",a.ab),this.currentTime=this.registerDataOutput("currentTime",a.ab),this.currentAnimationGroup=this.registerDataOutput("currentAnimationGroup",a.s8),this.animationGroup=this.registerDataInput("animationGroup",a.s8,t?.animationGroup),this.animation=this.registerDataInput("animation",a.s8),this.object=this.registerDataInput("object",a.s8)}_preparePendingTasks(t){let e=this.animationGroup.getValue(t),i=this.animation.getValue(t);if(!e&&!i)return this._reportError(t,"No animation or animation group provided");{let n=this.currentAnimationGroup.getValue(t);n&&n!==e&&n.dispose();let a=e;if(i&&!a){let e=this.object.getValue(t);if(!e)return this._reportError(t,"No target object provided");let n=Array.isArray(i)?i:[i],r=n[0].name;a=new o.AnimationGroup("flowGraphAnimationGroup-"+r+"-"+e.name,t.configuration.scene);let s=!1,u=t._getGlobalContextVariable("interpolationAnimations",[]);for(let t of n)a.addTargetedAnimation(t,e),-1!==u.indexOf(t.uniqueId)&&(s=!0);s&&this._checkInterpolationDuplications(t,n,e)}let r=this.speed.getValue(t)||1,s=this.from.getValue(t)??0,u=this.to.getValue(t)||a.to,l=!isFinite(u)||this.loop.getValue(t);this.currentAnimationGroup.setValue(a,t);let p=t._getGlobalContextVariable("currentlyRunningAnimationGroups",[]);-1!==p.indexOf(a.uniqueId)&&a.stop();try{a.start(l,r,s,u),a.onAnimationGroupEndObservable.add(()=>this._onAnimationGroupEnd(t)),a.onAnimationEndObservable.add(()=>this._eventsSignalOutputs.animationEnd._activateSignal(t)),a.onAnimationLoopObservable.add(()=>this._eventsSignalOutputs.animationLoop._activateSignal(t)),a.onAnimationGroupLoopObservable.add(()=>this._eventsSignalOutputs.animationGroupLoop._activateSignal(t)),p.push(a.uniqueId),t._setGlobalContextVariable("currentlyRunningAnimationGroups",p)}catch(e){this._reportError(t,e)}}}_reportError(t,e){super._reportError(t,e),this.currentFrame.setValue(-1,t),this.currentTime.setValue(-1,t)}_executeOnTick(t){let e=this.currentAnimationGroup.getValue(t);e&&(this.currentFrame.setValue(e.getCurrentFrame(),t),this.currentTime.setValue(e.animatables[0]?.elapsedTime??0,t))}_execute(t){this._startPendingTasks(t)}_onAnimationGroupEnd(t){this._removeFromCurrentlyRunning(t,this.currentAnimationGroup.getValue(t)),this._resetAfterCanceled(t),this.done._activateSignal(t)}_checkInterpolationDuplications(t,e,i){for(let n of t._getGlobalContextVariable("currentlyRunningAnimationGroups",[])){let a=t.assetsContext.animationGroups.find(t=>t.uniqueId===n);if(a)for(let n of a.targetedAnimations)for(let r of e)n.animation.targetProperty===r.targetProperty&&n.target===i&&this._stopAnimationGroup(t,a)}}_stopAnimationGroup(t,e){e.stop(!0),e.dispose(),this._removeFromCurrentlyRunning(t,e)}_removeFromCurrentlyRunning(t,e){let i=t._getGlobalContextVariable("currentlyRunningAnimationGroups",[]),n=i.indexOf(e.uniqueId);-1!==n&&(i.splice(n,1),t._setGlobalContextVariable("currentlyRunningAnimationGroups",i))}_cancelPendingTasks(t){let e=this.currentAnimationGroup.getValue(t);e&&this._stopAnimationGroup(t,e)}getClassName(){return"FlowGraphPlayAnimationBlock"}}(0,r.H7)("FlowGraphPlayAnimationBlock",s)}}]);