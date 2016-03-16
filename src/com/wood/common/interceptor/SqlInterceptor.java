package com.wood.common.interceptor;

import java.text.DateFormat;
import java.util.Date;
import java.util.List;
import java.util.Locale;
import java.util.Properties;
import org.apache.ibatis.mapping.BoundSql;
import org.apache.ibatis.mapping.MappedStatement;
import org.apache.ibatis.mapping.ParameterMapping;
import org.apache.ibatis.plugin.Interceptor;
import org.apache.ibatis.plugin.Intercepts;
import org.apache.ibatis.plugin.Invocation;
import org.apache.ibatis.plugin.Plugin;
import org.apache.ibatis.reflection.MetaObject;
import org.apache.ibatis.reflection.property.PropertyTokenizer;
import org.apache.ibatis.session.Configuration;
import org.apache.ibatis.type.TypeHandlerRegistry;
import org.apache.log4j.Logger;

@Intercepts({@org.apache.ibatis.plugin.Signature(type=org.apache.ibatis.executor.Executor.class, method="update", args={MappedStatement.class, Object.class}), @org.apache.ibatis.plugin.Signature(type=org.apache.ibatis.executor.Executor.class, method="query", args={MappedStatement.class, Object.class, org.apache.ibatis.session.RowBounds.class, org.apache.ibatis.session.ResultHandler.class})})
public class SqlInterceptor
  implements Interceptor
{
  private Properties properties;
  private final Logger log = Logger.getLogger(SqlInterceptor.class);

  public Properties getProperties() {
    return this.properties;
  }

  public Object intercept(Invocation invocation) throws Throwable {
    MappedStatement mappedStatement = (MappedStatement)invocation
      .getArgs()[0];
    Object parameter = null;
    if (invocation.getArgs().length > 1) {
      parameter = invocation.getArgs()[1];
    }
    String sqlId = mappedStatement.getId();
    BoundSql boundSql = mappedStatement.getBoundSql(parameter);
    Configuration configuration = mappedStatement.getConfiguration();

    Object returnValue = null;

    long start = System.currentTimeMillis();

    returnValue = invocation.proceed();
    long end = System.currentTimeMillis();

    long time = end - start;

    if (time > 1L) {
      String sql = getSql(configuration, boundSql);

      this.log.info("sqlId:" + sqlId);
      this.log.info(sql);
      this.log.info("time:" + time + "ms");
    }
    return returnValue;
  }

  private String getSql(Configuration configuration, BoundSql boundSql)
  {
    String sql = showSql(configuration, boundSql);

    StringBuilder str = new StringBuilder(100);

    str.append(sql);

    return str.toString();
  }

  private String showSql(Configuration configuration, BoundSql boundSql)
  {
    Object parameterObject = boundSql.getParameterObject();
    List<ParameterMapping> parameterMappings = boundSql
      .getParameterMappings();

    String sql = boundSql.getSql().replaceAll("[\\s]+", " ");

    if ((parameterMappings.size() > 0) && (parameterObject != null))
    {
      TypeHandlerRegistry typeHandlerRegistry = configuration.getTypeHandlerRegistry();

      if (typeHandlerRegistry.hasTypeHandler(parameterObject.getClass()))
      {
        sql = sql.replaceFirst("\\?", getParameterValue(parameterObject));
      }
      else
      {
        MetaObject metaObject = configuration.newMetaObject(parameterObject);

        for (ParameterMapping parameterMapping : parameterMappings)
        {
          String propertyName = parameterMapping.getProperty();
          PropertyTokenizer prop = new PropertyTokenizer(propertyName);

          if (metaObject.hasGetter(propertyName))
          {
            Object obj = metaObject.getValue(propertyName);
            sql = sql.replaceFirst("\\?", getParameterValue(obj));
          }
          else if (boundSql.hasAdditionalParameter(propertyName))
          {
            Object obj = boundSql.getAdditionalParameter(propertyName);
            sql = sql.replaceFirst("\\?", getParameterValue(obj));
            this.log.info("2222");
          }
          else if (propertyName.startsWith("__frch_"))
          {
            Object obj = boundSql.getAdditionalParameter(prop.getName());
            if (obj != null) {
              obj = configuration.newMetaObject(obj).getValue(propertyName.substring(prop.getName().length()));
              sql = sql.replaceFirst("\\?", getParameterValue(obj));
              this.log.info("3333:" + sql);
            }
          } else {
            Object obj = metaObject == null ? null : metaObject.getValue(propertyName);
            if (obj != null) {
              sql = sql.replaceFirst("\\?", getParameterValue(obj));
              this.log.info("4444:" + sql);
            }
          }
        }
      }
    }

    return sql;
  }

  private String getParameterValue(Object obj) {
    String value = null;
    if ((obj instanceof String)) {
      value = "'" + obj.toString() + "'";
    } else if ((obj instanceof Date)) {
      DateFormat formatter = DateFormat.getDateTimeInstance(
        2, 2, Locale.CHINA);
      value = "'" + formatter.format(obj) + "'";
    }
    else if (obj != null) {
      value = obj.toString();
    } else {
      value = "";
    }

    return value;
  }

  public Object plugin(Object target)
  {
    return Plugin.wrap(target, this);
  }

  public void setProperties(Properties properties0) {
    this.properties = properties0;
  }
}