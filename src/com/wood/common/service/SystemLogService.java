package com.wood.common.service;

import com.wood.common.mapper.SystemLogMapper;
import com.wood.common.model.SystemLog;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

@Service("systemLogService")
public class SystemLogService
{

  @Autowired
  private SystemLogMapper systemLogMapper;

  public int insert(SystemLog systemLog)
  {
    return this.systemLogMapper.insert(systemLog);
  }
}