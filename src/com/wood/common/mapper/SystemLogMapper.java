package com.wood.common.mapper;

import com.wood.common.model.SystemLog;

public abstract interface SystemLogMapper
{
  public abstract int insert(SystemLog paramSystemLog);

  public abstract int insertSelective(SystemLog paramSystemLog);
}