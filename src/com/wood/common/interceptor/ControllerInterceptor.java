package com.wood.common.interceptor;

import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import javax.servlet.http.HttpSession;

import org.apache.log4j.Logger;
import org.springframework.web.servlet.HandlerInterceptor;
import org.springframework.web.servlet.ModelAndView;

public class ControllerInterceptor
  implements HandlerInterceptor
{
  private final Logger log = Logger.getLogger(ControllerInterceptor.class);
  private String[] excludedUrls;

  public void setExcludedUrls(String[] excludedUrls)
  {
    this.excludedUrls = excludedUrls;
  }

  public void afterCompletion(HttpServletRequest request, HttpServletResponse response, Object handler, Exception ex)
    throws Exception
  {
    this.log.debug("==============执行顺序 3、afterCompletion================");
  }

  public void postHandle(HttpServletRequest request, HttpServletResponse response, Object handler, ModelAndView modelAndView)
    throws Exception
  {
    this.log.debug("==============执行顺序 2、postHandle================");
  }

  public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler)
    throws Exception
  {
    System.out.println("==============执行顺序 1、preHandle================");

    String url = request.getRequestURL().toString();
    String servletPath = request.getServletPath();
    String queryString = request.getQueryString();

    if (this.excludedUrls != null) {
      for (int i = 0; i < this.excludedUrls.length; i++) {
        if (request.getServletPath().matches(this.excludedUrls[i])) {
          this.log.debug("=============不作拦截==============");
          return true;
        }
      }
    }

    this.log.debug("==============进入前拦截================");

    HttpSession session = request.getSession();
    if (session.getAttribute("USER_INFOR") == null)
    {
      return true;
    }

//    HashMap userMenuRole = (HashMap)session
//      .getAttribute(GeneralConstants.USER_MENU_ROLE);
    if (queryString != null) {
      servletPath = servletPath + "?" + queryString;
    }

    System.out.println(servletPath);

    return true;
  }
}