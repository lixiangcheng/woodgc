package com.wood.common.model;

import java.util.Date;

public class SystemLog
{
  private String userId;
  private String path;
  private String ipAdd;
  private Date createDate;
  private String browser;
  private String value;

  public String getUserId()
  {
    return this.userId;
  }

  public void setUserId(String userId) {
    this.userId = (userId == null ? null : userId.trim());
  }

  public String getPath() {
    return this.path;
  }

  public void setPath(String path) {
    this.path = (path == null ? null : path.trim());
  }

  public String getIpAdd() {
    return this.ipAdd;
  }

  public void setIpAdd(String ipAdd) {
    this.ipAdd = (ipAdd == null ? null : ipAdd.trim());
  }

  public Date getCreateDate() {
    return this.createDate;
  }

  public void setCreateDate(Date createDate) {
    this.createDate = createDate;
  }

  public String getBrowser() {
    return this.browser;
  }

  public void setBrowser(String browser) {
    this.browser = (browser == null ? null : browser.trim());
  }

  public String getValue() {
    return this.value;
  }

  public void setValue(String value) {
    this.value = (value == null ? null : value.trim());
  }
}