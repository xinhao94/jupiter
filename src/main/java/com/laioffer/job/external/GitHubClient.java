package com.laioffer.job.external;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.laioffer.job.entity.Item;
import org.apache.http.HttpEntity;
import org.apache.http.HttpResponse;
import org.apache.http.client.ClientProtocolException;
import org.apache.http.client.ResponseHandler;
import org.apache.http.client.methods.HttpGet;
import org.apache.http.impl.client.CloseableHttpClient;
import org.apache.http.impl.client.HttpClients;

import java.io.IOException;
import java.io.UnsupportedEncodingException;
import java.net.URLEncoder;
import java.util.*;

public class GitHubClient {
    private static final String URL_TEMPLATE =
            "https://jobs.github.com/positions.json?description=%s&lat=%s&long=%s";
    private static final String DEFAULT_KEYWORD = "developer";

    public List<Item> search(double lat, double lon, String keyword) {
        if(keyword==null) {
            keyword = DEFAULT_KEYWORD;
        }

        // Note that in URLs, space is replaced with escape char %20 or +
        try {
            keyword = URLEncoder.encode(keyword, "UTF-8");
        } catch(UnsupportedEncodingException e) {
            e.printStackTrace();
        }
        String url = String.format(URL_TEMPLATE, keyword, lat, lon);

        CloseableHttpClient httpclient = HttpClients.createDefault();

        // Create a custom response handler
        ResponseHandler<List<Item>> responseHandler = new MyResponseHandler();

        try {
            return httpclient.execute(new HttpGet(url), responseHandler);
        } catch(IOException e) {
            e.printStackTrace();
        }
        return Collections.emptyList();
    }

    private static class MyResponseHandler implements ResponseHandler<List<Item>> {

        @Override
        public List<Item> handleResponse(HttpResponse response) throws ClientProtocolException, IOException {
            if(response.getStatusLine().getStatusCode() != 200) {
                return Collections.emptyList();
            }
            HttpEntity entity = response.getEntity();
            if(entity==null) {
                return Collections.emptyList();
            }

            // ObjectMapper mapper = new ObjectMapper();
            // Item[] items = mapper.readValue(entity.getContent(), Item[].class);
            // return Arrays.asList(items);

            ObjectMapper mapper = new ObjectMapper();
            Item[] items = mapper.readValue(entity.getContent(), Item[].class);
            List<Item> itemList = Arrays.asList(items);
            extractKeywords(itemList);
            return itemList;
        }
    }

    private static void extractKeywords(List<Item> items) {
        MonkeyLearnClient monkeyLearnClient = new MonkeyLearnClient();

        List<String> descriptions = new ArrayList<>();
        for(Item item : items) {
            String description = item.getDescription();
            // Must replace the illegal character to get response from MonkeyLearn
            // description = description.replace("·", " ");
            descriptions.add(description);
        }

        List<String> titles = new ArrayList<>();
        for (Item item : items) {
            titles.add(item.getTitle());
        }

        List<Set<String>> keywordList = monkeyLearnClient.extract(descriptions);
        if (keywordList.isEmpty()) {
            keywordList = monkeyLearnClient.extract(titles);
        }

        for(int i=0; i<items.size(); i++) {
            items.get(i).setKeywords(keywordList.get(i));
        }
    }
}
