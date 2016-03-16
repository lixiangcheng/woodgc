package com.wood.common.util;

import org.springframework.beans.BeansException;
import org.springframework.context.ApplicationContext;
import org.springframework.context.ApplicationContextAware;

public class WebApplicationContextTool
  implements ApplicationContextAware
{
  private ApplicationContext ctx;

  public void setApplicationContext(ApplicationContext actx)
    throws BeansException
  {
    this.ctx = actx;
  }

  public ApplicationContext getCtx() {
    return this.ctx;
  }
}